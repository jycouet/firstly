import type { Repository } from 'remult'

import { buildAtUri, parseAtUri, type AtRecord } from './AtRecord.js'

/** Where a record should live: `space: null` = the public repo. */
export interface AtTarget {
	space: string | null
	/** Another repo (must be writable by the session). Defaults to the source did. */
	did?: string
	/** Replace the target if it already exists (re-publish). Default: the PDS refuses. */
	overwrite?: boolean
}

/**
 * Copy a record to another home, same rkey (a space record and a public record are different
 * uris, so "publish" is a copy).
 */
export async function copyAtRecord<T extends AtRecord>(
	r: Repository<T>,
	uri: string,
	target: AtTarget,
): Promise<T> {
	const cur = await r.findId(uri as any)
	if (!cur) throw new Error(`record not found: ${uri}`)
	const { uri: _u, cid: _c, ...body } = cur
	const did = target.did ?? cur.did
	const next = { ...body, did, space: target.space } as Partial<T>
	if (target.overwrite) {
		const { collection, rkey } = parseAtUri(uri)
		const targetUri = buildAtUri({ did, collection, rkey, space: target.space })
		if (await r.findId(targetUri as any)) return r.update(targetUri as any, next)
	}
	return r.insert(next)
}

/** `copyAtRecord` then delete the source. Not atomic: a failed delete leaves both copies. */
export async function moveAtRecord<T extends AtRecord>(
	r: Repository<T>,
	uri: string,
	target: AtTarget,
): Promise<T> {
	const copy = await copyAtRecord(r, uri, target)
	await r.delete(uri as any)
	return copy
}
