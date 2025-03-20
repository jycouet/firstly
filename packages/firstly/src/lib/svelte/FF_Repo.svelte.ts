import type {
	ClassType,
	ErrorInfo,
	FieldMetadata,
	FindOptions,
	GroupByOptions,
	GroupByResult,
	MembersOnly,
	NumericKeys,
	Paginator,
	QueryOptions,
	QueryResult,
	Repository,
} from 'remult'
import { EntityError, repo as remultRepo } from 'remult'

// Define this locally since it's not exported from remult
type EmptyAggregateResult = 'EmptyAggregateResult'

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

// Helper type to extract aggregate result type from query options
type ExtractAggregateResult<Entity, Options extends FQueryOptions<Entity>> = Options extends {
	aggregate: infer A;
}
	? GroupByResult<
			Entity,
			never,
			A extends { sum?: infer S } ? S extends NumericKeys<Entity>[] ? S : never : never,
			A extends { avg?: infer V } ? V extends NumericKeys<Entity>[] ? V : never : never,
			A extends { min?: infer M } ? M extends (keyof MembersOnly<Entity>)[] ? M : never : never,
			A extends { max?: infer X } ? X extends (keyof MembersOnly<Entity>)[] ? X : never : never,
			A extends { distinctCount?: infer D } ? D extends (keyof MembersOnly<Entity>)[] ? D : never : never
	  >
	: EmptyAggregateResult

// Define a type for the paginator based on the query options
type PaginatorWithAggregate<Entity, Options extends FQueryOptions<Entity>> = Paginator<
	Entity,
	ExtractAggregateResult<Entity, Options>
>

// Any paginator type that has the necessary properties we need
type AnyPaginator<Entity> = {
	items: Entity[];
	hasNextPage: boolean;
	aggregates?: any;
	count(): Promise<number>;
	nextPage(): Promise<any>;
}

export class FF_Repo<Entity, Options extends FQueryOptions<Entity> = FQueryOptions<Entity>> {
	#repo: Repository<Entity>
	#paginator: PaginatorWithAggregate<Entity, Options> | undefined
	#queryOptions: Options | undefined

	fields: Repository<Entity>['fields']
	metadata: Repository<Entity>['metadata']

	loading = $state<Loading>({
		init: false,
		fetching: false,
		more: false,
	})

	items = $state<Entity[] | undefined>(undefined)
	aggregates = $state<ExtractAggregateResult<Entity, Options> | undefined>(undefined)
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
		o?: { findOptions?: FindOptions<Entity>; queryOptions?: Options },
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
			this.query(o.queryOptions as FQueryOptions<Entity>)
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
			const mergedOptions = {
				pageSize: 2,
				...this.#queryOptions,
				...options,
				aggregate: {
					...this.#queryOptions?.aggregate,
					...options.aggregate,
				},
			}
			
			const queryResult = this.#repo.query(mergedOptions)
			this.#paginator = await queryResult.paginator() as PaginatorWithAggregate<Entity, Options>
			this.items = this.#paginator.items
			// @ts-ignore - We know the structure will match due to how we define the types
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
			const nextPage = await this.#paginator.nextPage()
			this.#paginator = nextPage as PaginatorWithAggregate<Entity, Options>
			this.items?.push(...nextPage.items)
			this.hasNextPage = nextPage.hasNextPage
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
