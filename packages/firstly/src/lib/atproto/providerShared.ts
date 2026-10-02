import {
	ArrayEntityDataProvider,
	EntityError,
	type EntityDataProvider,
	type EntityDataProviderFindOptions,
	type EntityDataProviderGroupByOptions,
	type EntityMetadata,
	type Filter,
	type FilterConsumer,
} from 'remult'

import { XrpcError } from './xrpc.js'

export interface RawRecord {
	uri: string
	cid: string
	value: Record<string, unknown>
	rkey?: string
	collection?: string
}

export interface Write {
	op: 'create' | 'update' | 'delete'
	did: string
	space: string | null
	collection: string
	rkey: string
	record?: Record<string, unknown>
}

export const nsidFor = (space: string | null, method: string) =>
	`com.atproto.${space ? 'space' : 'repo'}.${method}`

export const xrpcToEntityError = (e: unknown): never => {
	if (e instanceof XrpcError) {
		throw new EntityError({
			message: e.message,
			httpStatusCode: e.status === 400 && e.error === 'InvalidSwap' ? 409 : e.status,
			exception: e,
		})
	}
	throw e
}

export const NOOP_CONSUMER: FilterConsumer = {
	or() {},
	not() {},
	isEqualTo() {},
	isDifferentFrom() {},
	isNull() {},
	isNotNull() {},
	isGreaterOrEqualTo() {},
	isGreaterThan() {},
	isLessOrEqualTo() {},
	isLessThan() {},
	containsCaseInsensitive() {},
	notContainsCaseInsensitive() {},
	startsWithCaseInsensitive() {},
	endsWithCaseInsensitive() {},
	isIn() {},
	custom() {},
	databaseCustom() {},
}

/** Loads the candidate rows for a filter, then lets Remult finish filtering / sorting / paging in memory. */
export abstract class InMemoryEntityProvider<T> implements EntityDataProvider {
	constructor(protected entity: EntityMetadata) {}

	protected abstract rows(where?: Filter): Promise<T[]>
	abstract insert(data: any): Promise<any>
	abstract update(id: any, data: any): Promise<any>
	abstract delete(id: any): Promise<void>

	protected mem(rows: T[]) {
		return new ArrayEntityDataProvider(this.entity, () => rows as any[])
	}
	async find(options?: EntityDataProviderFindOptions) {
		return this.mem(await this.rows(options?.where)).find(options)
	}
	async count(where: Filter) {
		return this.mem(await this.rows(where)).count(where)
	}
	async groupBy(options?: EntityDataProviderGroupByOptions) {
		return this.mem(await this.rows(options?.where)).groupBy(options)
	}
}
