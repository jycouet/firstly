import {
	repo as remultRepo,
	type ClassType,
	type FindOptions,
	type GroupByOptions,
	type GroupByResult,
	type MembersOnly,
	type NumericKeys,
	type Paginator,
	type QueryOptions,
	type Repository,
} from 'remult'
import { Log } from '@kitql/helpers'

import { tryCatch, tryCatchSync } from './tryCatch'

// In our case the empty is always the $count (so almost empty :))
type EmptyAggregateResult = {
	$count: number
}

type Loading = {
	init: boolean
	fetching: boolean
	more: boolean
	saving: boolean
	deleting: boolean
}

type QueryOptionsHelper<entityType> = QueryOptions<entityType> & {
	aggregate?: Omit<
		GroupByOptions<
			entityType,
			never,
			NumericKeys<entityType>[],
			NumericKeys<entityType>[],
			(keyof MembersOnly<entityType>)[],
			(keyof MembersOnly<entityType>)[],
			(keyof MembersOnly<entityType>)[]
		>,
		'group' | 'orderBy' | 'where' | 'limit' | 'page'
	>
}

// Helper type to extract aggregate result type from query options
type ExtractAggregateResult<Entity, Options extends QueryOptionsHelper<Entity>> = Options extends {
	aggregate: infer A
}
	? GroupByResult<
			Entity,
			never,
			A extends { sum?: infer S } ? (S extends NumericKeys<Entity>[] ? S : never) : never,
			A extends { avg?: infer V } ? (V extends NumericKeys<Entity>[] ? V : never) : never,
			A extends { min?: infer M } ? (M extends (keyof MembersOnly<Entity>)[] ? M : never) : never,
			A extends { max?: infer X } ? (X extends (keyof MembersOnly<Entity>)[] ? X : never) : never,
			A extends { distinctCount?: infer D }
				? D extends (keyof MembersOnly<Entity>)[]
					? D
					: never
				: never
		>
	: EmptyAggregateResult

// Define a type for the paginator based on the query options
type PaginatorWithAggregate<Entity, Options extends QueryOptionsHelper<Entity>> = Paginator<
	Entity,
	ExtractAggregateResult<Entity, Options>
>

export class FF_Repo<
	Entity,
	QueryOptions extends QueryOptionsHelper<Entity> = QueryOptionsHelper<Entity>,
> {
	#repo: Repository<Entity>
	#paginator: PaginatorWithAggregate<Entity, QueryOptions> | undefined
	#findOptions: FindOptions<Entity> | undefined
	#queryOptions: QueryOptions | undefined

	fields: Repository<Entity>['fields']
	metadata: Repository<Entity>['metadata']

	loading = $state<Loading>({
		init: false,
		fetching: false,
		more: false,
		saving: false,
		deleting: false,
	})

	items = $state<Entity[] | undefined>(undefined)
	aggregates = $state<ExtractAggregateResult<Entity, QueryOptions> | undefined>(undefined)
	hasNextPage = $state<boolean | undefined>(undefined)

	item = $state<Entity | undefined>(undefined)
	// errors = $state<ErrorInfo<Entity> | undefined>(undefined)
	globalError = $state<string | undefined>(undefined)

	private loadingEnd = <T = undefined>(toRet?: T) => {
		this.loading = {
			init: false,
			fetching: false,
			more: false,
			saving: false,
			deleting: false,
		}
		return toRet
	}

	constructor(
		public ent: ClassType<Entity>,
		o?: (
			| {
					findOptions?: FindOptions<Entity> & { skipAutoFetch?: boolean }
					queryOptions?: never
			  }
			| {
					findOptions?: never
					queryOptions?: QueryOptions & { skipAutoFetch?: boolean }
			  }
		) & { item?: Entity },
	) {
		this.#repo = remultRepo(ent)
		this.fields = this.#repo.fields
		this.metadata = this.#repo.metadata
		this.#paginator = undefined
		this.#findOptions = o?.findOptions
		this.#queryOptions = o?.queryOptions
		this.item = o?.item

		if (o?.findOptions !== undefined && !o.findOptions.skipAutoFetch) {
			this.loading.init = true
			this.find(o.findOptions)
		} else if (o?.queryOptions !== undefined && !o.queryOptions.skipAutoFetch) {
			this.loading.init = true
			this.query(o.queryOptions)
		} else {
			this.loadingEnd()
		}
	}

	async find(options: FindOptions<Entity>) {
		this.loading.fetching = true

		const { data, error } = await tryCatch(
			this.#repo.find({
				...this.#findOptions,
				...options,
			}),
		)
		if (error) {
			this.globalError = error.message
			return this.loadingEnd()
		}

		this.items = data
		return this.loadingEnd(data)
	}

	async query(options: Pick<QueryOptionsHelper<Entity>, 'where' | 'orderBy'>) {
		this.loading.fetching = true

		const { data: queryResult, error: queryResultError } = tryCatchSync(() =>
			this.#repo.query({
				pageSize: 25,
				...this.#queryOptions,
				...options,
				// Yes, we always want to aggregate to get at least the $count!
				// End empty object is giving us that
				aggregate: {
					...this.#queryOptions?.aggregate,
				},
			}),
		)
		if (queryResultError) {
			this.globalError = queryResultError.message
			return this.loadingEnd()
		}

		const { data: paginator, error: paginatorError } = await tryCatch(queryResult.paginator())
		if (paginatorError) {
			this.globalError = paginatorError.message
			return this.loadingEnd()
		}

		this.#paginator = paginator as PaginatorWithAggregate<Entity, QueryOptions>
		this.items = this.#paginator.items
		// @ts-expect-error - We know the structure will match due to how we define the types
		this.aggregates = this.#paginator.aggregates
		this.hasNextPage = this.#paginator.hasNextPage && this.aggregates!.$count > this.items!.length

		return this.loadingEnd({
			items: this.items,
			aggregates: this.aggregates!,
			hasNextPage: this.hasNextPage,
		})
	}

	async queryMore() {
		if (this.#paginator === undefined) {
			new Log('FF_Repo').error('No paginator found')
			return undefined
		}
		this.loading = {
			...this.loading,
			fetching: true,
			more: true,
		}

		const { data: nextPage, error: nextPageError } = await tryCatch(this.#paginator.nextPage())
		if (nextPageError) {
			this.globalError = nextPageError.message
			return this.loadingEnd()
		}

		this.#paginator = nextPage as PaginatorWithAggregate<Entity, QueryOptions>
		this.items?.push(...nextPage.items)
		this.hasNextPage = this.#paginator.hasNextPage && this.aggregates!.$count > this.items!.length

		return this.loadingEnd({
			items: this.items,
			aggregates: this.aggregates!,
			hasNextPage: this.hasNextPage,
		})
	}

	create(...args: Parameters<Repository<Entity>['create']>) {
		this.item = this.#repo.create(...args)
		return this.item
	}

	async delete(...args: Parameters<Repository<Entity>['delete']>) {
		this.loading.deleting = true
		await this.#repo.delete(...args)
		// REMULT P4: return the deleted item ?
		if (typeof args[0] === 'string') {
			this.items = this.items?.filter((i) => this.metadata.idMetadata.getId(i) !== args[0])
		} else {
			this.items = this.items?.filter(
				(i) => this.metadata.idMetadata.getId(i) !== this.metadata.idMetadata.getId(args[0]),
			)
		}
		if (this.aggregates) {
			this.aggregates.$count = this.aggregates.$count - 1
		}
		return this.loadingEnd()
	}
}
