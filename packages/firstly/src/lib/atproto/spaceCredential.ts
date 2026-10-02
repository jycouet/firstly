import { resolvePds, type IdentityOptions } from './identity.js'
import { xrpcClient, XrpcError, type XrpcClient } from './xrpc.js'

// Reading another member's repo in a space takes a *space credential*: the reader's PDS
// mints a delegation token, the space authority swaps it for a credential bound to a
// DPoP key (RFC 9449), and every read carries the credential plus a fresh proof.

const b64url = (buf: ArrayBuffer | Uint8Array) =>
	Buffer.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf)).toString('base64url')
const utf8 = (s: string) => new TextEncoder().encode(s)

export interface DpopKey {
	privateKey: CryptoKey
	jwk: JsonWebKey
}

export async function createDpopKey(): Promise<DpopKey> {
	const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
		'sign',
	])
	const { kty, crv, x, y } = await crypto.subtle.exportKey('jwk', pair.publicKey)
	return { privateKey: pair.privateKey, jwk: { kty, crv, x, y } }
}

/** A `DPoP` proof JWT for one request; `credential` adds the `ath` binding. */
export async function dpopProof(
	key: DpopKey,
	opts: { htm: string; htu: string; credential?: string },
): Promise<string> {
	const u = new URL(opts.htu)
	const header = { alg: 'ES256', typ: 'dpop+jwt', jwk: key.jwk }
	const payload: Record<string, unknown> = {
		jti: b64url(crypto.getRandomValues(new Uint8Array(16))),
		htm: opts.htm,
		htu: u.origin + u.pathname,
		iat: Math.floor(Date.now() / 1000),
	}
	if (opts.credential)
		payload.ath = b64url(await crypto.subtle.digest('SHA-256', utf8(opts.credential)))
	const signing = `${b64url(utf8(JSON.stringify(header)))}.${b64url(utf8(JSON.stringify(payload)))}`
	const sig = await crypto.subtle.sign(
		{ name: 'ECDSA', hash: 'SHA-256' },
		key.privateKey,
		utf8(signing),
	)
	return `${signing}.${b64url(sig)}`
}

export interface SpaceCredential {
	credential: string
	key: DpopKey
}

/** Delegation token from the reader's PDS, exchanged at the authority for a credential. */
export async function obtainSpaceCredential(opts: {
	/** The reader's authenticated client (needs a `space:` read scope). */
	session: XrpcClient
	space: string
	key: DpopKey
	identity?: IdentityOptions
}): Promise<SpaceCredential> {
	const { token } = await opts.session.query('com.atproto.space.getDelegationToken', {
		space: opts.space,
	})
	const authority = opts.space.split('/')[2]
	const service = await resolvePds(authority, opts.identity)
	const htu = `${service}/xrpc/com.atproto.space.getSpaceCredential`
	const f = opts.identity?.fetch ?? fetch
	const res = await f(htu, {
		method: 'POST',
		headers: {
			authorization: `Bearer ${token}`,
			dpop: await dpopProof(opts.key, { htm: 'POST', htu }),
			'content-type': 'application/json',
		},
		body: JSON.stringify({ space: opts.space }),
	})
	const json = await res.json().catch(() => ({}))
	if (!res.ok) throw new XrpcError(res.status, json.error ?? 'Unknown', json.message)
	return { credential: json.credential, key: opts.key }
}

/** A `fetch` presenting the credential (`Authorization: DPoP`) with a proof per request. */
export const spaceCredentialFetch =
	(sc: SpaceCredential, f: typeof fetch = fetch): typeof fetch =>
	async (input, init) => {
		const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
		const headers = new Headers(init?.headers)
		headers.set('authorization', `DPoP ${sc.credential}`)
		headers.set(
			'dpop',
			await dpopProof(sc.key, { htm: init?.method ?? 'GET', htu: url, credential: sc.credential }),
		)
		return f(input, { ...init, headers })
	}

/** Client for one repo host, authenticated with a space credential. */
export const spaceCredentialClient = (service: string, sc: SpaceCredential, f?: typeof fetch) =>
	xrpcClient({ service, fetch: spaceCredentialFetch(sc, f) })
