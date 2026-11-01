import { BROWSER } from 'esm-env'
import {
	Filter,
	remult,
	repo,
	type ClassType,
	type DataProvider,
	type EntityFilter,
	type FindOptions,
} from 'remult'

import { read, type RepoRead } from './read.remote.js'

/** Kit's `RemoteQuery`, spelled out: it moved between Kit 2 and 3. */
export type RepoQuery<T> = Promise<T> & {
	readonly current: T | undefined
	readonly error: any
	readonly loading: boolean
	readonly ready: boolean
	refresh(): Promise<void>
}

const WRITES = new Set<PropertyKey>([
	'insert',
	'update',
	'delete',
	'deleteMany',
	'updateMany',
	'upsertMany',
])

/** Entity key -> args of the queries on screen. */
const live = new Map<string, Map<string, { arg: RepoRead; count: number }>>()

const track = (arg: RepoRead) => {
	const id = JSON.stringify(arg)
	try {
		$effect.pre(() => {
			const args = live.get(arg.key) ?? live.set(arg.key, new Map()).get(arg.key)!
			const entry = args.get(id) ?? args.set(id, { arg, count: 0 }).get(id)!
			entry.count++
			return () => {
				if (--entry.count === 0) args.delete(id)
			}
		})
	} catch {
		// not in a reactive context: nothing on screen to refresh
	}
}

// allSettled: a failed refresh must not fail the write that triggered it
const refreshLive = (key: string) =>
	Promise.allSettled([...(live.get(key)?.values() ?? [])].map(({ arg }) => read(arg).refresh()))

const withRefresh = (dp: DataProvider): DataProvider =>
	new Proxy(dp, {
		get(t, p) {
			if (p !== 'getEntityDataProvider') return Reflect.get(t, p)
			return (entity: Parameters<DataProvider['getEntityDataProvider']>[0]) =>
				new Proxy(t.getEntityDataProvider(entity), {
					get(edp, m) {
						const v = Reflect.get(edp, m) as any
						if (typeof v !== 'function') return v
						if (!WRITES.has(m)) return v.bind(edp)
						return async (...args: unknown[]) => {
							const result = await v.apply(edp, args)
							await refreshLive(entity.key)
							return result
						}
					},
				})
		},
	})

if (BROWSER) remult.dataProvider = withRefresh(remult.dataProvider)

const mapped = <R, T>(inner: any, arg: RepoRead, map: (raw: R) => T) =>
	new Proxy(inner, {
		get(t, p) {
			if (p === 'then') {
				track(arg)
				// read now: Kit pins the query in the reactive context of this getter
				const then = t.then
				return (ok: any, err: any) => then.call(t, map).then(ok, err)
			}
			if (p === 'current') return t.current === undefined ? undefined : map(t.current)
			const v = Reflect.get(t, p)
			return typeof v === 'function' ? v.bind(t) : v
		},
	}) as RepoQuery<T>

/**
 * `repo(E)` for reactive reads: SSR goes through the API (rules apply, as the
 * current user) and hydration sends no query.
 *
 * ```svelte
 * <script lang="ts">
 * 	import { repo } from 'remult'
 *
 * 	import { queryRepo } from 'firstly/svelte/query'
 *
 * 	let { params } = $props()
 *
 * 	let tasks = $derived(await queryRepo(Task).find({ where: { slug: params.slug } }))
 * </script>
 *
 * {#each tasks as task (task.id)}
 * 	<button onclick={() => repo(Task).update(task.id, { done: true })}>{task.title}</button>
 * {/each}
 * ```
 *
 * Plain `repo(E)` writes in the browser refresh the queries of `E` on screen.
 * To do so, importing this wraps `remult.dataProvider` in the browser. Call
 * `.refresh()` for what it can't see: BackendMethods, `include`d entities and
 * other users' writes.
 *
 * A failed refresh reaches the error page, like any `.refresh()` in Kit.
 * Long filters can exceed the URL limit: arguments travel in a GET.
 *
 * @experimental Needs Kit 3 with `experimental.remoteFunctions` and
 * `compilerOptions.experimental.async`.
 */
export const queryRepo = <T>(entity: ClassType<T>) => {
	const r = repo(entity)
	const run = <R, O>(
		method: RepoRead['method'],
		options: FindOptions<T> | undefined,
		map: (raw: R) => O,
	) => {
		const where = options?.where && Filter.entityFilterToJson(r.metadata, options.where)
		const arg = { key: r.metadata.key, method, options: { ...options, where } } as RepoRead
		return mapped(read(arg), arg, map)
	}
	return {
		find: (options?: FindOptions<T>) => run('find', options, (rows: any[]) => r.fromJson(rows)),
		findFirst: (where?: EntityFilter<T>, options?: FindOptions<T>) =>
			run<any[], T | undefined>(
				'find',
				{ ...options, where, limit: 1 },
				(rows) => r.fromJson(rows)[0],
			),
		count: (where?: EntityFilter<T>) => run('count', { where }, (n: number) => n),
	}
}
