import {
	NodeOAuthClient,
	type NodeSavedSession,
	type NodeSavedState,
	type OAuthSession,
} from '@atproto/oauth-client-node'
import type { Cookies } from '@sveltejs/kit'

import { atConfig } from './config.server'

// Demo-grade: in-memory stores + a did cookie. Real apps persist both stores.
const RE_TRAILING_SLASH = /\/+$/
const states = new Map<string, NodeSavedState>()
const sessions = new Map<string, NodeSavedSession>()
const clients = new Map<string, NodeOAuthClient>()

/** Bearer token for a proxy (e.g. a throwaway account): the account password never reaches us. */
export type TokenSession = {
	kind: 'token'
	did: string
	service: string
	fetchHandler: (url: string, init?: RequestInit) => Promise<Response>
	signOut: () => Promise<void>
}
export type AtSession = OAuthSession | TokenSession
export const isToken = (s: AtSession): s is TokenSession => 'kind' in s && s.kind === 'token'

const tokens = new Map<string, TokenSession>()

export function loginWithToken(
	cookies: Cookies,
	{ service, did, token }: { service: string; did: string; token: string },
) {
	const base = service.replace(RE_TRAILING_SLASH, '')
	tokens.set(did, {
		kind: 'token',
		did,
		service: base,
		fetchHandler: (url, init) =>
			fetch(url.startsWith('http') ? url : base + url, {
				...init,
				headers: { ...(init?.headers as Record<string, string>), authorization: `Bearer ${token}` },
			}),
		signOut: async () => void tokens.delete(did),
	})
	writeAtDid(cookies, did)
}

export const AT_COOKIE = 'ff_at_did'
// `space:` grants are what the spaces alpha checks; `transition:generic` covers the public repo.
const SCOPE =
	'atproto transition:generic space:*?authority=*&collection=*&manage=create&manage=update&manage=delete'

// Loopback clients need no hosted metadata; the redirect must be 127.0.0.1, not localhost.
export function oauthClient(origin: string) {
	const o = new URL(origin)
	const loopback = o.hostname === 'localhost' || o.hostname === '127.0.0.1'
	const base = loopback ? `http://127.0.0.1:${o.port}` : origin
	const redirect = `${base}/callback`
	let c = clients.get(base)
	if (!c) {
		c = new NodeOAuthClient({
			clientMetadata: {
				client_id: loopback
					? `http://localhost?redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent(SCOPE)}`
					: `${base}/client-metadata.json`,
				client_name: 'firstly atproto demo',
				redirect_uris: [redirect],
				scope: SCOPE,
				grant_types: ['authorization_code', 'refresh_token'],
				response_types: ['code'],
				application_type: 'web',
				token_endpoint_auth_method: 'none',
				dpop_bound_access_tokens: true,
			},
			allowHttp: atConfig.local,
			plcDirectoryUrl: atConfig.plc,
			handleResolver: atConfig.pds ?? 'https://public.api.bsky.app',
			stateStore: {
				set: async (k, v) => void states.set(k, v),
				get: async (k) => states.get(k),
				del: async (k) => void states.delete(k),
			},
			sessionStore: {
				set: async (k, v) => void sessions.set(k, v),
				get: async (k) => sessions.get(k),
				del: async (k) => void sessions.delete(k),
			},
		})
		clients.set(base, c)
	}
	return { client: c, base }
}

export const readAtDid = (cookies: Cookies) => cookies.get(AT_COOKIE)

export const writeAtDid = (cookies: Cookies, did?: string) => {
	if (!did) return cookies.delete(AT_COOKIE, { path: '/' })
	cookies.set(AT_COOKIE, did, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7,
	})
}

/** Restored OAuth session for the cookie's did, or undefined when logged out / expired. */
export async function oauthSession(
	origin: string,
	cookies: Cookies,
): Promise<AtSession | undefined> {
	const did = readAtDid(cookies)
	if (!did) return
	const t = tokens.get(did)
	if (t) return t
	if (!sessions.has(did)) return
	try {
		return await oauthClient(origin).client.restore(did)
	} catch {
		return
	}
}
