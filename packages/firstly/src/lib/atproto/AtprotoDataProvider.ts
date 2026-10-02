import type { DataProvider, EntityDataProvider, EntityMetadata } from 'remult'

import { buildAtUri, parseAtUri } from './AtRecord.js'
import { resolvePds } from './identity.js'
import { nsidFor, xrpcToEntityError, type RawRecord, type Write } from './providerShared.js'
import { RecordProvider } from './RecordProvider.js'
import { AtSpace, AtSpaceMember } from './spaceEntities.js'
import { MemberProvider, SpaceProvider } from './SpaceProvider.js'
import { pdsSupportsSpaces } from './spaceSupport.js'
import { xrpcClient, XrpcError, type XrpcClient, type XrpcOptions } from './xrpc.js'

export interface AtprotoOptions extends Partial<XrpcOptions> {
	/** Own PDS. Optional for public reads: other repos are always resolved to their own PDS. */
	service?: string
	/** Default repo for reads without a `did` filter and for inserts without `did`. */
	did?: string
	/** Bring your own client (OAuth session, tests). `service` is then optional. */
	xrpc?: XrpcClient
	/** Reads of other repos go to their own PDS (unauthenticated). Defaults to plc / did:web lookup; a BYO `xrpc` handles all repos itself. */
	resolveService?: (did: string) => Promise<string>
	/** listRecords page size. Defaults to the endpoint max: 100 for repos, 1000 for spaces. */
	pageSize?: number
	/** Ask the PDS to validate against known lexicons. */
	validate?: boolean
	/** A PDS cannot count; `count()` walks pages up to this many records and stops. */
	maxCount?: number
	/** Other members' repos in a space need a space credential: return a `fetch` that presents one. */
	spaceAuth?: (space: string) => Promise<typeof fetch>
}

const noSession = () =>
	Promise.reject(new XrpcError(401, 'NoSession', 'no PDS session: pass `service` or `xrpc`'))
const NO_SESSION: XrpcClient = { query: noSession, procedure: noSession }

export class AtprotoDataProvider implements DataProvider {
	readonly xrpc: XrpcClient
	readonly did?: string
	readonly pageSize?: number
	readonly validate?: boolean
	readonly maxCount: number
	private foreign = new Map<string, Promise<XrpcClient>>()
	private spaceAuth?: (space: string) => Promise<typeof fetch>
	private resolveService?: (did: string) => Promise<string>
	private fetch: typeof fetch

	constructor(opts: AtprotoOptions) {
		this.fetch = opts.fetch ?? fetch
		// No session at all: reads still work (each repo is resolved to its own PDS), writes cannot.
		this.xrpc =
			opts.xrpc ??
			(opts.service
				? xrpcClient({ service: opts.service, auth: opts.auth, fetch: this.fetch })
				: NO_SESSION)
		this.did = opts.did
		this.pageSize = opts.pageSize
		this.validate = opts.validate
		this.maxCount = opts.maxCount ?? 1000
		this.spaceAuth = opts.spaceAuth
		this.resolveService =
			opts.resolveService ?? (opts.xrpc ? undefined : (did) => resolvePds(did, { fetch: this.fetch }))
	}

	getEntityDataProvider(entity: EntityMetadata): EntityDataProvider {
		if (entity.key === AtSpace.KEY) return new SpaceProvider(this, entity)
		if (entity.key === AtSpaceMember.KEY) return new MemberProvider(this, entity)
		return new RecordProvider(this, entity)
	}

	/** Buffers writes and commits them as one `applyWrites` (one repo + space per transaction). */
	async transaction(action: (dp: DataProvider) => Promise<void>): Promise<void> {
		const buffer: Write[] = []
		const batched: DataProvider = {
			getEntityDataProvider: (entity) => {
				if (entity.key === AtSpace.KEY || entity.key === AtSpaceMember.KEY)
					throw new Error('spaces cannot be managed inside a transaction')
				return new RecordProvider(this, entity, buffer)
			},
			transaction: async (a) => a(batched),
		}
		await action(batched)
		if (!buffer.length) return
		const groups = new Set(buffer.map((w) => `${w.space ?? ''}|${w.did}`))
		if (groups.size > 1) throw new Error('a transaction can only target one repo (did) and one space')
		const { did, space } = buffer[0]
		const writes = buffer.map((w) => ({
			$type: `com.atproto.${space ? 'space' : 'repo'}.applyWrites#${w.op}`,
			collection: w.collection,
			rkey: w.rkey,
			...(w.record ? { value: w.record } : {}),
		}))
		await this.xrpc
			.procedure(nsidFor(space, 'applyWrites'), {
				repo: did,
				...(space ? { space } : {}),
				validate: this.validate,
				writes,
			})
			.catch(xrpcToEntityError)
	}

	/** Own repo -> session client. Other repos -> their PDS, with a space credential inside a space. */
	clientFor(did: string, space: string | null): Promise<XrpcClient> {
		if (did === this.did) return Promise.resolve(this.xrpc)
		if (space && !this.spaceAuth) return Promise.resolve(this.xrpc)
		if (!space && !this.resolveService) return Promise.resolve(this.xrpc)
		const key = `${space ?? ''}|${did}`
		let c = this.foreign.get(key)
		if (!c) {
			c = (async () => {
				const service = this.resolveService ? await this.resolveService(did) : ''
				// A stock PDS would choke on the DPoP credential header with a confusing nonce error.
				if (space && service && !(await pdsSupportsSpaces(service, { fetch: this.fetch })))
					throw new XrpcError(501, 'SpacesNotSupported', `the PDS of ${did} has no spaces support`)
				const f = space ? await this.spaceAuth!(space) : this.fetch
				return xrpcClient({ service, fetch: f })
			})().catch((e) => {
				this.foreign.delete(key)
				throw e
			})
			this.foreign.set(key, c)
		}
		return c
	}

	/** All records of one collection, one repo, one space (paginated to the end unless `max`). */
	async listRecords(
		did: string,
		collection: string,
		space: string | null,
		opts: { max?: number; reverse?: boolean } = {},
	): Promise<RawRecord[]> {
		const pageSize = this.pageSize ?? (space ? 1000 : 100)
		const out: RawRecord[] = []
		let cursor: string | undefined
		do {
			const limit = Math.min(pageSize, opts.max ? opts.max - out.length : pageSize)
			if (limit <= 0) break
			const res = await (
				await this.clientFor(did, space)
			)
				.query(nsidFor(space, 'listRecords'), {
					repo: did,
					...(space ? { space } : {}),
					collection,
					limit,
					cursor,
					reverse: opts.reverse || undefined,
				})
				.catch((e) => {
					// A member who never wrote in the space has no repo there yet.
					if (space && e instanceof XrpcError && e.error === 'RepoNotFound') return { records: [] }
					return xrpcToEntityError(e)
				})
			for (const r of res.records as RawRecord[]) {
				if (!r.value) continue
				const rkey = r.rkey ?? parseAtUri(r.uri).rkey
				out.push({ ...r, rkey, uri: buildAtUri({ did, collection, rkey, space }) })
			}
			cursor = res.cursor
		} while (cursor)
		return out
	}

	/** Collections present in a repo (`describeRepo`). */
	async describeRepo(did: string): Promise<{ did: string; handle: string; collections: string[] }> {
		const r = await (
			await this.clientFor(did, null)
		)
			.query('com.atproto.repo.describeRepo', { repo: did })
			.catch(xrpcToEntityError)
		return { did: r.did, handle: r.handle, collections: r.collections ?? [] }
	}

	async getRecord(
		did: string,
		collection: string,
		rkey: string,
		space: string | null,
	): Promise<RawRecord | null> {
		try {
			const r = await (
				await this.clientFor(did, space)
			).query(nsidFor(space, 'getRecord'), {
				repo: did,
				...(space ? { space } : {}),
				collection,
				rkey,
			})
			return { ...r, rkey, uri: buildAtUri({ did, collection, rkey, space }) }
		} catch (e) {
			if (e instanceof XrpcError && (e.status === 404 || e.error === 'RecordNotFound')) return null
			return xrpcToEntityError(e)
		}
	}
}
