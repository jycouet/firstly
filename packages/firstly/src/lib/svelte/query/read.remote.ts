import { error } from '@sveltejs/kit'
import { Filter, repo, type ClassType, type FindOptions } from 'remult'

import { getRequestEvent, query } from '$app/server'

import { repoFetch } from '../remultApiLoad.js'

export type RepoRead = { key: string; method: 'find' | 'count'; options?: FindOptions<any> }

const READS = new Set(['find', 'count'])
let byKey: Map<string, ClassType<any>> | undefined

// TODO(remult): needs a public way to resolve an entity by key
const allEntities = (): ClassType<any>[] =>
	(globalThis as any)[Symbol.for('remult-static1')]?.allEntities ?? []

export const read = query('unchecked', async ({ key, method, options }: RepoRead) => {
	byKey ??= new Map(allEntities().map((e) => [repo(e).metadata.key, e]))
	const entity = byKey.get(key)
	// reachable by anyone: only known entities, only reads
	if (!entity || !READS.has(method)) error(404)
	// never `repo()`: on the server it reads the DB without API rules
	const r = repoFetch(getRequestEvent().fetch)(entity)
	const where = options?.where && Filter.entityFilterFromJson(r.metadata, options.where as any)
	try {
		if (method === 'count') return await r.count(where)
		// toJson keeps included relations as class instances
		return JSON.parse(JSON.stringify(r.toJson(await r.find({ ...options, where }))))
	} catch (e: any) {
		error(e?.status ?? e?.httpStatusCode ?? 500, e?.message ?? 'Error')
	}
})
