import { Entity, Fields, type DataProvider } from 'remult'

/** Fields the provider owns; everything else on the entity is the lexicon record body. */
export const AT_META_FIELDS = ['uri', 'did', 'rkey', 'cid', 'space'] as const

/** Where `AtRecord` / `AtSpace` / `AtSpaceMember` get their provider from, unless the entity sets `dataProvider` itself. */
export const atprotoConfig: {
	/** Return `undefined` to fall back to the default provider (e.g. on the client, where `dp.isProxy`). */
	dataProvider?: (defaultProvider: DataProvider) => DataProvider | undefined | Promise<DataProvider>
} = {}

export const viaAtprotoConfig = (dp: DataProvider) => atprotoConfig.dataProvider?.(dp)

/**
 * Base for an entity backed by one lexicon collection: `@Entity('<nsid>')` a subclass and add the
 * record fields. `id` and `dataProvider` are inherited from here.
 */
@Entity('_at_record', { id: 'uri', dataProvider: viaAtprotoConfig })
export abstract class AtRecord {
	/** at://did/collection/rkey, or space-scoped: at://authority/space/type/skey/did/collection/rkey */
	@Fields.string({ caption: 'URI', allowApiUpdate: false }) uri = ''
	/** Repo (author). Defaults to the provider's own did on insert. */
	@Fields.string({ caption: 'DID' }) did = ''
	/** Record key. Defaults to a TID on insert. */
	@Fields.string({ caption: 'Record key' }) rkey = ''
	@Fields.string({ caption: 'CID', allowApiUpdate: false }) cid = ''
	/** null = public repo, else the space uri the record lives in. */
	@Fields.string({ caption: 'Space', allowNull: true }) space: string | null = null
}

/** Any record of any collection: `collection` is the NSID, `value` the raw lexicon body. Filter by `did` + `collection`. */
@Entity<AtAny>('_at_any', {
	allowApiRead: true,
	caption: 'AT records (any collection)',
	defaultOrderBy: { rkey: 'desc' },
})
export class AtAny extends AtRecord {
	static KEY = '_at_any'
	@Fields.string({ caption: 'Collection (NSID)' }) collection = ''
	@Fields.json() value: Record<string, unknown> = {}
}

export interface ParsedAtUri {
	did: string
	collection: string
	rkey: string
	space: string | null
}

const RE_SPACE_URI = /^(at:\/\/[^/]+\/space\/[^/]+\/[^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/
const RE_REPO_URI = /^at:\/\/([^/]+)\/([^/]+)\/([^/]+)$/

export function parseAtUri(uri: string): ParsedAtUri {
	const s = RE_SPACE_URI.exec(uri)
	if (s) return { space: s[1], did: s[2], collection: s[3], rkey: s[4] }
	const r = RE_REPO_URI.exec(uri)
	if (r) return { space: null, did: r[1], collection: r[2], rkey: r[3] }
	throw new Error(`not an at:// record uri: ${uri}`)
}

export function buildAtUri(p: ParsedAtUri): string {
	const tail = `${p.did}/${p.collection}/${p.rkey}`
	return p.space ? `${p.space}/${tail}` : `at://${tail}`
}

export function spaceUri(authority: string, type: string, skey: string) {
	return `at://${authority}/space/${type}/${skey}`
}

const TID_CHARS = '234567abcdefghijklmnopqrstuvwxyz'
let lastTid = 0n
const clockId = BigInt(Math.floor(Math.random() * 1024))

/** Timestamp identifier: sortable base32 of (micros << 10 | clockId), monotonic per process. */
export function tid(now = Date.now()): string {
	let micros = BigInt(now) * 1000n
	if (micros <= lastTid) micros = lastTid + 1n
	lastTid = micros
	let n = (micros << 10n) | clockId
	let out = ''
	for (let i = 0; i < 13; i++) {
		out = TID_CHARS[Number(n & 31n)] + out
		n >>= 5n
	}
	return out
}
