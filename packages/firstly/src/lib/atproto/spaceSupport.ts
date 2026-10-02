import { resolvePds, type IdentityOptions } from './identity.js'

// `describeServer` has no capability flag, so probe a method WITH a required param:
// XRPC validates params before auth, so a spaces PDS answers 400, a stock one 401.
const PROBE_PATH = '/xrpc/com.atproto.simplespace.getSpace'
const PROBE_TIMEOUT_MS = 3_000
const TTL_MS = 10 * 60_000

const cache = new Map<string, { at: number; capable: boolean }>()

/** Does this PDS run a spaces build? Cached per origin; unreachable = false for the TTL. */
export async function pdsSupportsSpaces(
	service: string,
	o: { fetch?: typeof fetch; force?: boolean } = {},
): Promise<boolean> {
	const hit = cache.get(service)
	if (!o.force && hit && Date.now() - hit.at < TTL_MS) return hit.capable
	let capable = false
	try {
		const res = await (o.fetch ?? fetch)(`${service}${PROBE_PATH}`, {
			signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
		})
		capable = res.status === 400
	} catch {}
	cache.set(service, { at: Date.now(), capable })
	return capable
}

/** Same, from a did. Never throws: an unresolvable did is not space-capable. */
export async function didSupportsSpaces(
	did: string,
	o: IdentityOptions & { force?: boolean } = {},
): Promise<boolean> {
	try {
		return await pdsSupportsSpaces(await resolvePds(did, o), o)
	} catch {
		return false
	}
}
