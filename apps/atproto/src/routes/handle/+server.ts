import { json } from '@sveltejs/kit'

import { didSupportsSpaces, isDid, resolveHandle } from 'firstly/atproto'

import { atConfig } from '$lib/config.server'
import { publicDp } from '$lib/provider'

import type { RequestHandler } from './$types'

const cache = new Map<string, Promise<{ did: string; handle: string; spaces: boolean }>>()

/** `?id=<did or handle>` -> `{ did, handle }`, memoised per process. */
export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id') ?? ''
	let p = cache.get(id)
	if (!p) {
		p = (async () => {
			// A local PDS knows its own handles; otherwise the public network resolves.
			const did = isDid(id) ? id : await resolveHandle(id, { service: atConfig.pds })
			const [r, spaces] = await Promise.all([
				publicDp.describeRepo(did).catch(() => ({ handle: did })),
				didSupportsSpaces(did, { plcDirectory: atConfig.plc }),
			])
			return { did, handle: r.handle, spaces }
		})()
		p.catch(() => cache.delete(id))
		cache.set(id, p)
	}
	try {
		return json(await p)
	} catch (e) {
		return json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
	}
}
