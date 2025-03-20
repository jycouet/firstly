import type {
	ClassType,
	ErrorInfo,
	FieldMetadata,
	FindOptions,
	GroupByOptions,
	GroupByResult,
	MembersOnly,
	NumericKeys,
	QueryOptions,
	QueryResult,
	Repository,
} from 'remult'
import { EntityError, repo as remultRepo } from 'remult'

type Loading = {
	init: boolean
	fetching: boolean
	more: boolean
}

type FQueryOptions<entityType> = QueryOptions<entityType> & {
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
// type PaginatorOf<T extends (...args: any) => any> = Awaited<ReturnType<ReturnType<T>['paginator']>>

export class FF_Repo<Entity> {
	#repo: Repository<Entity>
	// #paginator: PaginatorOf<Repository<Entity>['query']> | undefined
	#paginator: any | undefined
	#queryOptions: FQueryOptions<Entity> | undefined

	fields: Repository<Entity>['fields']
	metadata: Repository<Entity>['metadata']

	loading = $state<Loading>({
		init: false,
		fetching: false,
		more: false,
	})

	items = $state<Entity[] | undefined>(undefined)
	aggregates = $state<GroupByResult<Entity, never, never, never, never, never, never> | undefined>(
		undefined,
	)
	hasNextPage = $state<boolean | undefined>(undefined)

	item = $state<Entity | undefined>(undefined)
	errors = $state<ErrorInfo<Entity> | undefined>(undefined)
	globalError = $state<string | undefined>(undefined)

	private loadingEnd = () => {
		this.loading = {
			init: false,
			fetching: false,
			more: false,
		}
	}

	constructor(
		ent: ClassType<Entity>,
		o?: { findOptions?: FindOptions<Entity>; queryOptions?: FQueryOptions<Entity> },
	) {
		this.#repo = remultRepo(ent)
		this.fields = this.#repo.fields
		this.metadata = this.#repo.metadata
		this.#paginator = undefined
		this.#queryOptions = o?.queryOptions

		this.loading.init = o?.findOptions !== undefined || o?.queryOptions !== undefined

		if (o?.findOptions !== undefined) {
			this.find(o.findOptions)
		} else if (o?.queryOptions !== undefined) {
			this.query(o.queryOptions)
		}
	}

	async find(options: FindOptions<Entity>) {
		this.loading.fetching = true
		try {
			this.items = await this.#repo.find(options)
		} catch (error) {
			// @ts-ignore
			this.globalError = error?.message
		}

		this.loadingEnd()
		return this.items
	}

	async query(options: FQueryOptions<Entity>) {
		this.loading.fetching = true
		try {
			this.#paginator = await this.#repo
				.query({
					pageSize: 2,
					...this.#queryOptions,
					...options,
					aggregate: {
						...this.#queryOptions?.aggregate,
						...options.aggregate,
					},
				})
				.paginator()
			this.items = this.#paginator.items
			this.aggregates = this.#paginator.aggregates
			this.hasNextPage = this.#paginator.hasNextPage
		} catch (error) {
			// @ts-ignore
			this.globalError = error?.message
		}

		this.loadingEnd()

		return { items: this.items, aggregates: this.aggregates, hasNextPage: this.hasNextPage }
	}

	async queryMore() {
		if (this.#paginator === undefined) {
			throw new Error('No paginator found')
		}
		this.loading = {
			...this.loading,
			fetching: true,
			more: true,
		}
		try {
			this.#paginator = await this.#paginator.nextPage()
			this.items?.push(...this.#paginator.items)
			this.hasNextPage = this.#paginator.hasNextPage
		} catch (error) {
			// @ts-ignore
			this.globalError = error?.message
		}

		this.loadingEnd()

		return { items: this.items, aggregates: this.aggregates, hasNextPage: this.hasNextPage }
	}

	create(...args: Parameters<Repository<Entity>['create']>) {
		this.item = this.#repo.create(...args)
		return this.item
	}
}
