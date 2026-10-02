import {
	ArrayEntityDataProvider,
	EntityError,
	type EntityDataProvider,
	type EntityDataProviderFindOptions,
	type EntityDataProviderGroupByOptions,
	type EntityMetadata,
	type Filter,
} from 'remult'

import type { AtprotoDataProvider } from './AtprotoDataProvider.js'
import { AT_META_FIELDS, AtAny, buildAtUri, parseAtUri, tid } from './AtRecord.js'
import { extractAxes, type FilterAxes } from './filterAxes.js'
import { nsidFor, xrpcToEntityError, type RawRecord, type Write } from './providerShared.js'

const META = new Set<string>(AT_META_FIELDS)

/** One lexicon collection as a Remult entity. */
export class RecordProvider implements EntityDataProvider {
	/** `AtAny`: the collection comes from the filter and the body sits in `value`. */
	private generic: boolean
	private fixedCollection: string

	constructor(
		private dp: AtprotoDataProvider,
		private entity: EntityMetadata,
		private buffer?: Write[],
	) {
		this.generic = entity.key === AtAny.KEY
		this.fixedCollection = entity.dbName || entity.key
	}

	private collectionOf(axes?: FilterAxes, data?: Record<string, unknown>) {
		if (!this.generic) return this.fixedCollection
		const c = (data?.collection as string) || axes?.collection
		if (!c) throw new Error('AtAny: a `collection` filter is required')
		return c
	}

	private toRow(r: RawRecord, did: string, space: string | null, collection: string) {
		const meta = { uri: r.uri, did, rkey: r.rkey, cid: r.cid, space }
		if (this.generic) return { ...meta, collection, value: r.value }
		const value = { ...r.value }
		delete value.$type
		return { ...value, ...meta }
	}

	private fromRow(row: Record<string, unknown>) {
		const result: Record<string, unknown> = {}
		for (const col of this.entity.fields)
			result[col.key] = col.valueConverter.fromJson(row[col.dbName])
		return result
	}

	/** Lexicon body: non-meta fields, JSON-encoded, nulls dropped (lexicons have no null). */
	private toRecord(data: Record<string, unknown>, collection: string) {
		if (this.generic) return { ...(data.value as Record<string, unknown>), $type: collection }
		const record: Record<string, unknown> = { $type: collection }
		for (const col of this.entity.fields) {
			if (META.has(col.key) || data[col.key] === undefined) continue
			const json = col.valueConverter.toJson(data[col.key])
			if (json !== null && json !== undefined) record[col.dbName] = json
		}
		return record
	}

	private async fetchRows(axes: FilterAxes, opts: { max?: number; reverse?: boolean } = {}) {
		const dids = axes.dids ?? (this.dp.did ? [this.dp.did] : [])
		if (!dids.length)
			throw new Error(`${this.entity.key}: a \`did\` filter (or a default did) is required`)
		const space = axes.space ?? null
		const collection = this.collectionOf(axes)
		const rows: Record<string, unknown>[] = []
		for (const did of dids) {
			if (axes.rkeys) {
				for (const rkey of axes.rkeys) {
					const r = await this.dp.getRecord(did, collection, rkey, space)
					if (r) rows.push(this.toRow(r, did, space, collection))
				}
			} else {
				const list = await this.dp.listRecords(did, collection, space, dids.length === 1 ? opts : {})
				rows.push(...list.map((r) => this.toRow(r, did, space, collection)))
			}
		}
		return rows
	}

	private inMemory(rows: Record<string, unknown>[]) {
		return new ArrayEntityDataProvider(this.entity, () => rows)
	}

	async find(options?: EntityDataProviderFindOptions) {
		const axes = extractAxes(options?.where)
		// Raw PDS page when nothing else has to be filtered and the sort is the native rkey order.
		const seg = options?.orderBy?.Segments ?? []
		// Within one repo rkey is unique and uri order == rkey order: only the first segment matters.
		const nativeSort = seg.every((x) => x.field.key === 'rkey' || x.field.key === 'uri')
		const rawPage = axes.exact && !axes.rkeys && nativeSort && options?.limit
		const rows = await this.fetchRows(axes, {
			max: rawPage ? options.limit! * (options.page || 1) : undefined,
			reverse: rawPage && seg[0]?.isDescending === false ? true : undefined,
		})
		return this.inMemory(rows).find(options)
	}

	/** Capped at `maxCount`: a PDS has no count endpoint. */
	async count(where: Filter) {
		const axes = extractAxes(where)
		const rows = await this.fetchRows(axes, { max: axes.exact ? this.dp.maxCount : undefined })
		return this.inMemory(rows).count(where)
	}

	/** Aggregates are capped like `count` (this is also how `$count` reaches a grid). */
	async groupBy(options?: EntityDataProviderGroupByOptions) {
		const axes = extractAxes(options?.where)
		const rows = await this.fetchRows(axes, { max: axes.exact ? this.dp.maxCount : undefined })
		return this.inMemory(rows).groupBy(options)
	}

	private async write(w: Write, current?: RawRecord) {
		if (this.buffer) {
			this.buffer.push(w)
			return ''
		}
		const { op, did, space, collection, rkey, record } = w
		const method = op === 'create' ? 'createRecord' : op === 'update' ? 'putRecord' : 'deleteRecord'
		const res = await this.dp.xrpc
			.procedure(nsidFor(space, method), {
				repo: did,
				...(space ? { space } : {}),
				...(op === 'update' && !space && current ? { swapRecord: current.cid } : {}),
				collection,
				rkey,
				...(record ? { validate: this.dp.validate, record } : {}),
			})
			.catch(xrpcToEntityError)
		return (res?.cid as string) ?? ''
	}

	async insert(data: Record<string, unknown>) {
		const did = (data.did as string) || this.dp.did
		if (!did) throw new Error(`${this.entity.key}: \`did\` is required to insert`)
		const space = (data.space as string | null) || null
		const rkey = (data.rkey as string) || tid()
		const collection = this.collectionOf(undefined, data)
		const record = this.toRecord(data, collection)
		const uri = buildAtUri({ did, collection, rkey, space })
		const cid = await this.write({ op: 'create', did, space, collection, rkey, record })
		return this.fromRow(this.toRow({ uri, cid, rkey, value: record }, did, space, collection))
	}

	async update(id: string, data: Record<string, unknown>) {
		const { did, rkey, space, collection } = parseAtUri(id)
		const current = await this.dp.getRecord(did, collection, rkey, space)
		if (!current) throw new EntityError({ message: `record not found: ${id}`, httpStatusCode: 404 })
		const merged = { ...this.fromRow(this.toRow(current, did, space, collection)), ...data }
		const record = this.toRecord(merged, collection)
		const cid = await this.write({ op: 'update', did, space, collection, rkey, record }, current)
		return this.fromRow(this.toRow({ uri: id, cid, rkey, value: record }, did, space, collection))
	}

	async delete(id: string) {
		const { did, rkey, space, collection } = parseAtUri(id)
		await this.write({ op: 'delete', did, space, collection, rkey })
	}
}
