import type { EntityMetadata, Filter } from 'remult'

import type { AtprotoDataProvider } from './AtprotoDataProvider.js'
import { InMemoryEntityProvider, NOOP_CONSUMER, xrpcToEntityError } from './providerShared.js'
import { AtSpace, AtSpaceMember, type AppAccess, type SpacePolicy } from './spaceEntities.js'
import { XrpcError } from './xrpc.js'

const RE_SPACE = /^at:\/\/([^/]+)\/space\/([^/]+)\/([^/]+)$/

const policyToLex = (p: SpacePolicy, managingApp?: string) =>
	p === 'public'
		? { $type: 'com.atproto.simplespace.defs#publicPolicy' }
		: p === 'member-list'
			? { $type: 'com.atproto.simplespace.defs#memberListPolicy' }
			: { $type: 'com.atproto.simplespace.defs#managingAppPolicy', managingApp }

const policyFromLex = (v: any): SpacePolicy =>
	v?.$type?.endsWith('#publicPolicy')
		? 'public'
		: v?.$type?.endsWith('#managingAppPolicy')
			? 'managing-app'
			: 'member-list'

const accessToLex = (a: AppAccess, allowed: string[]) =>
	a === 'open'
		? { $type: 'com.atproto.simplespace.defs#open' }
		: { $type: 'com.atproto.simplespace.defs#allowList', allowed }

const fromView = (v: any): AtSpace => {
	const m = RE_SPACE.exec(v.uri)
	return {
		uri: v.uri,
		authority: m?.[1] ?? '',
		type: m?.[2] ?? '',
		skey: m?.[3] ?? '',
		readPolicy: policyFromLex(v.readPolicy),
		writePolicy: policyFromLex(v.writePolicy),
		managingApp: v.readPolicy?.managingApp ?? v.writePolicy?.managingApp ?? '',
		appAccess: v.appAccess?.$type?.endsWith('#allowList') ? 'allow-list' : 'open',
		allowedApps: v.appAccess?.allowed ?? [],
		managed: !!v.readPolicy,
	}
}

/** `com.atproto.simplespace.*` as the `AtSpace` entity. */
export class SpaceProvider extends InMemoryEntityProvider<AtSpace> {
	constructor(
		private dp: AtprotoDataProvider,
		entity: EntityMetadata,
	) {
		super(entity)
	}

	protected rows(where?: Filter) {
		const c = {
			uris: [] as string[],
			type: undefined as string | undefined,
			did: undefined as string | undefined,
		}
		where?.__applyToConsumer({
			...NOOP_CONSUMER,
			isEqualTo: (col, val) => {
				if (col.key === 'uri' && val) c.uris.push(val)
				if (col.key === 'type') c.type = val
				if (col.key === 'authority') c.did = val
			},
			isIn: (col, val) => {
				if (col.key === 'uri') c.uris.push(...val.filter(Boolean))
			},
		})
		return this.load(c)
	}

	private async load(c: { uris: string[]; type?: string; did?: string }) {
		const uris = new Set<string>(c.uris)
		const listed = !uris.size
		if (listed) {
			let cursor: string | undefined
			do {
				const res = await this.dp.xrpc
					.query('com.atproto.space.listSpaces', { type: c.type, did: c.did, limit: 100, cursor })
					.catch(xrpcToEntityError)
				for (const s of res.spaces) uris.add(s.uri)
				cursor = res.cursor
			} while (cursor)
		}
		const out: AtSpace[] = []
		for (const uri of uris) {
			try {
				out.push(fromView(await this.dp.xrpc.query('com.atproto.simplespace.getSpace', { space: uri })))
			} catch (e) {
				if (!(e instanceof XrpcError && e.error === 'SpaceNotFound')) xrpcToEntityError(e)
				// Created with the raw space API (no simplespace policies): still a space you write in.
				if (listed) out.push(fromView({ uri }))
			}
		}
		return out
	}

	async insert(data: AtSpace) {
		const res = await this.dp.xrpc
			.procedure('com.atproto.simplespace.createSpace', {
				type: data.type,
				skey: data.skey || undefined,
				readPolicy: policyToLex(data.readPolicy, data.managingApp),
				writePolicy: policyToLex(data.writePolicy, data.managingApp),
				appAccess: accessToLex(data.appAccess, data.allowedApps),
			})
			.catch(xrpcToEntityError)
		const [row] = await this.load({ uris: [res.uri] })
		return row
	}

	async update(id: string, data: Partial<AtSpace>) {
		const [cur] = await this.load({ uris: [id] })
		const next = { ...cur, ...data } as AtSpace
		await this.dp.xrpc
			.procedure('com.atproto.simplespace.updateSpace', {
				space: id,
				readPolicy: policyToLex(next.readPolicy, next.managingApp),
				writePolicy: policyToLex(next.writePolicy, next.managingApp),
				appAccess: accessToLex(next.appAccess, next.allowedApps),
			})
			.catch(xrpcToEntityError)
		return next
	}

	async delete(id: string) {
		await this.dp.xrpc
			.procedure('com.atproto.simplespace.deleteSpace', { space: id })
			.catch(xrpcToEntityError)
	}
}

// Compound id "space,did" - the space uri has no comma, the did has none either.
const parseMemberId = (id: string) => {
	const i = id.lastIndexOf(',')
	return { space: id.slice(0, i), did: id.slice(i + 1) }
}

/** `simplespace.listMembers / putMember / removeMember` as the `AtSpaceMember` entity. */
export class MemberProvider extends InMemoryEntityProvider<AtSpaceMember> {
	constructor(
		private dp: AtprotoDataProvider,
		entity: EntityMetadata,
	) {
		super(entity)
	}

	protected rows(where?: Filter) {
		let space: string | undefined
		where?.__applyToConsumer({
			...NOOP_CONSUMER,
			isEqualTo: (col, val) => {
				if (col.key === 'space') space = val
			},
		})
		if (!space) throw new Error('AtSpaceMember: a `space` filter is required')
		return this.load(space)
	}

	private async load(space: string) {
		const out: AtSpaceMember[] = []
		let cursor: string | undefined
		do {
			const res = await this.dp.xrpc
				.query('com.atproto.simplespace.listMembers', { space, limit: 1000, cursor })
				.catch(xrpcToEntityError)
			for (const m of res.members) out.push({ space, did: m.did, read: m.read, write: m.write })
			cursor = res.cursor
		} while (cursor)
		return out
	}

	private async put(m: AtSpaceMember) {
		await this.dp.xrpc
			.procedure('com.atproto.simplespace.putMember', {
				space: m.space,
				did: m.did,
				read: m.read,
				write: m.write,
			})
			.catch(xrpcToEntityError)
		return m
	}

	insert(data: AtSpaceMember) {
		return this.put({ ...data, read: data.read ?? true, write: data.write ?? true })
	}

	async update(id: any, data: Partial<AtSpaceMember>) {
		const { space, did } = typeof id === 'string' ? parseMemberId(id) : id
		const cur = (await this.load(space)).find((m) => m.did === did)
		return this.put({ space, did, read: true, write: true, ...cur, ...data })
	}

	async delete(id: any) {
		const { space, did } = typeof id === 'string' ? parseMemberId(id) : id
		await this.dp.xrpc
			.procedure('com.atproto.simplespace.removeMember', { space, did })
			.catch(xrpcToEntityError)
	}
}
