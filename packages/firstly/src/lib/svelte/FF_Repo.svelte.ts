import type {
	ClassType,
	ErrorInfo,
	FieldMetadata,
	FindOptions,
	QueryOptions,
	QueryResult,
	Repository,
} from 'remult'
import { EntityError, repo as remultRepo } from 'remult'

type Loading = {
	init: boolean
	fetching: boolean
}

export class FF_Repo<Entity> {
	#repo: Repository<Entity>
	fields: Repository<Entity>['fields']
	metadata: Repository<Entity>['metadata']
	// #query: ReturnType<Repository<Entity>['query']>
	// paginator: QueryResult<Entity>['paginator'] | undefined = undefined
	#paginator: any = undefined

	loading = $state<Loading>({
		init: false,
		fetching: false,
	})

	items = $state<Entity[] | undefined>(undefined)
	totalCount = $state<number | undefined>(undefined)
	hasNextPage = $state<boolean | undefined>(undefined)

	item = $state<Entity | undefined>(undefined)
	errors = $state<ErrorInfo<Entity> | undefined>(undefined)
	globalError = $state<string | undefined>(undefined)

	constructor(
		ent: ClassType<Entity>,
		o?: { findOptions?: FindOptions<Entity>; queryOptions?: QueryOptions<Entity> },
	) {
		this.#repo = remultRepo(ent)
		this.fields = this.#repo.fields
		this.metadata = this.#repo.metadata
		// this.query = this.#repo.query
		// const t = this.#repo.query(o?.queryOptions)
		// const p = t.paginator()

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

		this.loading = {
			...this.loading,
			init: false,
			fetching: false,
		}
		return this.items
	}

	async query(options: QueryOptions<Entity>) {
		this.loading.fetching = true
		try {
			this.#paginator = await this.#repo
				.query({ ...options, pageSize: 2, aggregate: { ...options.aggregate } })
				.paginator()
			this.items = this.#paginator.items
			this.totalCount = this.#paginator.aggregates.$count
			this.hasNextPage = this.#paginator.hasNextPage
		} catch (error) {
			// @ts-ignore
			this.globalError = error?.message
		}

		this.loading = {
			...this.loading,
			init: false,
			fetching: false,
		}
		return this.items
	}

	async queryMore() {
		if (this.#paginator === undefined) {
			throw new Error('No paginator found')
		}
		this.loading.fetching = true
		try {
			this.#paginator = await this.#paginator.nextPage()
			this.items?.push(...this.#paginator.items)
			this.hasNextPage = this.#paginator.hasNextPage
		} catch (error) {
			// @ts-ignore
			this.globalError = error?.message
		}
		this.loading.fetching = false
	}

	create(...args: Parameters<Repository<Entity>['create']>) {
		this.item = this.#repo.create(...args)
		return this.item
	}
}
