import { remult, type DataProvider } from 'remult'
import {
	atprotoConfig,
	AtprotoDataProvider,
	createDpopKey,
	obtainSpaceCredential,
	resolvePds,
	spaceCredentialFetch,
	xrpcClient,
	type DpopKey,
	type SpaceCredential,
} from 'firstly/atproto'

import { atConfig } from './config.server'
import { isToken, type AtSession } from './oauth.server'

const MAX_COUNT = 500

// One provider per identity so listing caches survive across requests.
export const publicDp = new AtprotoDataProvider({
	service: atConfig.pds,
	maxCount: MAX_COUNT,
	resolveService: (did) => resolvePds(did, { plcDirectory: atConfig.plc }),
})
const byDid = new Map<string, { dp: AtprotoDataProvider; ref: { s: AtSession } }>()

let key: Promise<DpopKey> | undefined
const dpopKey = () => (key ??= createDpopKey())

// Logged out: public reads of any repo. Logged in: the OAuth session (DPoP fetch) targets your own PDS.
export const atprotoFor = (dp: DataProvider): DataProvider | undefined => {
	if (dp.isProxy) return undefined
	const s = remult.context.at
	if (!s) return publicDp
	let entry = byDid.get(s.did)
	if (!entry) {
		const ref = { s }
		const session = xrpcClient({
			service: '',
			fetch: (url, init) => ref.s.fetchHandler(String(url), init),
		})
		// One credential per (reader, space), fetched on first foreign read in that space.
		const credentials = new Map<string, Promise<SpaceCredential>>()
		const spaceAuth = async (space: string) => {
			let c = credentials.get(space)
			if (!c) {
				c = dpopKey()
					.then((key) =>
						obtainSpaceCredential({ session, space, key, identity: { plcDirectory: atConfig.plc } }),
					)
					.catch((e) => {
						credentials.delete(space)
						throw e
					})
				credentials.set(space, c)
			}
			return spaceCredentialFetch(await c)
		}
		entry = {
			ref,
			dp: new AtprotoDataProvider({
				did: s.did,
				xrpc: session,
				resolveService: (did) => resolvePds(did, { plcDirectory: atConfig.plc }),
				// A bearer proxy already scopes the space; DPoP credentials can't be minted through it.
				spaceAuth: isToken(s) ? undefined : spaceAuth,
				maxCount: MAX_COUNT,
			}),
		}
		byDid.set(s.did, entry)
	}
	entry.ref.s = s
	return entry.dp
}

atprotoConfig.dataProvider = atprotoFor

declare module 'remult' {
	interface RemultContext {
		at?: AtSession
	}
}
