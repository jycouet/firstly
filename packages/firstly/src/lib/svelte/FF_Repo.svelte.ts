import type { ClassType, ErrorInfo, FieldMetadata, FindOptions, Repository } from 'remult'
import { repo as remultRepo } from 'remult'

type Loading = {
	init: boolean
	fetching: boolean
}

export class FF_Repo<Entity> {
	loading = $state<Loading>({
		init: false,
		fetching: false,
	})

	items = $state<Entity[] | undefined>(undefined)
	item = $state<Entity | undefined>(undefined)
	errors: ErrorInfo<Entity> | undefined
	globalError?: string | undefined

	repo: Repository<Entity>

	constructor(
		public ent: ClassType<Entity>,
		o?: { findOptions?: FindOptions<Entity> },
	) {
		this.repo = remultRepo(ent)

		this.loading.init = o?.findOptions !== undefined

		if (o?.findOptions !== undefined) {
			this.find(o.findOptions)
		}
	}

	async find(options: FindOptions<Entity>) {
		this.loading.fetching = true
		this.items = await this.repo.find(options)
		this.loading = {
			...this.loading,
			init: false,
			fetching: false,
		}
	}
}
