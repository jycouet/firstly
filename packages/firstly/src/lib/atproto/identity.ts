import { xrpcClient, XrpcError } from './xrpc.js'

const RE_DID = /^did:(plc|web):/
const PUBLIC_API = 'https://public.api.bsky.app'

export const isDid = (s: string) => RE_DID.test(s)

export interface IdentityOptions {
	fetch?: typeof fetch
	/** Where handles are resolved (any PDS / appview works). */
	service?: string
	/** PLC directory, e.g. a local one for a dev PDS. */
	plcDirectory?: string
}

export async function resolveHandle(handle: string, o: IdentityOptions = {}): Promise<string> {
	if (isDid(handle)) return handle
	return (
		await xrpcClient({ service: o.service ?? PUBLIC_API, fetch: o.fetch }).query(
			'com.atproto.identity.resolveHandle',
			{ handle },
		)
	).did
}

/** PDS endpoint of a did, from the PLC directory or the did:web document. */
export async function resolvePds(did: string, o: IdentityOptions = {}): Promise<string> {
	const f = o.fetch ?? fetch
	const url = did.startsWith('did:web:')
		? `https://${decodeURIComponent(did.slice(8))}/.well-known/did.json`
		: `${o.plcDirectory ?? 'https://plc.directory'}/${did}`
	const res = await f(url, { signal: AbortSignal.timeout(15_000) })
	if (!res.ok) throw new XrpcError(res.status, 'DidNotFound', `cannot resolve ${did}`)
	const doc = await res.json()
	const svc = doc.service?.find(
		(s: any) => s.id === '#atproto_pds' || s.type === 'AtprotoPersonalDataServer',
	)
	if (!svc?.serviceEndpoint)
		throw new XrpcError(404, 'PdsNotFound', `no PDS in did document of ${did}`)
	return svc.serviceEndpoint
}

export interface AtSession {
	did: string
	handle: string
	service: string
	accessJwt: string
	refreshJwt: string
}

/** App-password login (`com.atproto.server.createSession`). Prefer OAuth in real apps. */
export async function createSession(
	identifier: string,
	password: string,
	o: IdentityOptions = {},
): Promise<AtSession> {
	const did = await resolveHandle(identifier, o)
	const service = await resolvePds(did, o)
	const s = await xrpcClient({ service, fetch: o.fetch }).procedure(
		'com.atproto.server.createSession',
		{ identifier, password },
	)
	return { did: s.did, handle: s.handle, service, accessJwt: s.accessJwt, refreshJwt: s.refreshJwt }
}
