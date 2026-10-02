import type { FieldMetadata, Filter, FilterConsumer } from 'remult'

import { parseAtUri } from './AtRecord.js'

/** What a PDS can filter on. Anything else is applied in memory afterwards. */
export interface FilterAxes {
	dids?: string[]
	rkeys?: string[]
	/** undefined = not constrained, null = public repo, string = that space */
	space?: string | null
	/** Only meaningful for the generic `AtAny` entity. */
	collection?: string
	/** false when the filter has conditions beyond the axes (so a raw PDS page is not enough). */
	exact: boolean
}

const asArr = (v: unknown) => (Array.isArray(v) ? v.map(String) : [String(v)])

class AxesConsumer implements FilterConsumer {
	axes: FilterAxes = { exact: true }
	private other() {
		this.axes.exact = false
	}
	isEqualTo(col: FieldMetadata, val: any) {
		this.isIn(col, [val])
	}
	isIn(col: FieldMetadata, val: any[]) {
		if (col.key === 'uri') this.uris(asArr(val))
		else if (col.key === 'did') this.axes.dids = asArr(val)
		else if (col.key === 'rkey') this.axes.rkeys = asArr(val)
		else if (col.key === 'collection' && val.length === 1) this.axes.collection = String(val[0])
		else if (col.key === 'space') {
			if (val.length === 1) this.axes.space = val[0] ?? null
			else this.other()
		} else this.other()
	}
	// A uri pins all three axes; mixed spaces cannot be pushed as one listing.
	private uris(uris: string[]) {
		const parsed = uris.map(parseAtUri)
		if (new Set(parsed.map((p) => p.space)).size !== 1) return this.other()
		this.axes.space = parsed[0].space
		this.axes.dids = [...new Set(parsed.map((p) => p.did))]
		this.axes.rkeys = [...new Set(parsed.map((p) => p.rkey))]
		if (new Set(parsed.map((p) => p.collection)).size === 1)
			this.axes.collection = parsed[0].collection
	}
	isNull(col: FieldMetadata) {
		if (col.key === 'space') this.axes.space = null
		else this.other()
	}
	// `$or` of branches that each pin a did in the same space / collection = one listing per did.
	or(branches: Filter[]) {
		this.other()
		const parts = branches.map(extractAxes)
		if (parts.some((p) => !p.dids || p.rkeys)) return
		if (new Set(parts.map((p) => `${p.space}|${p.collection}`)).size !== 1) return
		this.axes.dids = [...new Set(parts.flatMap((p) => p.dids!))]
		if (parts[0].space !== undefined) this.axes.space = parts[0].space
		if (parts[0].collection) this.axes.collection = parts[0].collection
	}
	// Not pushable: only ANDed equalities reach the PDS.
	not() {
		this.other()
	}
	isDifferentFrom() {
		this.other()
	}
	isNotNull() {
		this.other()
	}
	isGreaterOrEqualTo() {
		this.other()
	}
	isGreaterThan() {
		this.other()
	}
	isLessOrEqualTo() {
		this.other()
	}
	isLessThan() {
		this.other()
	}
	containsCaseInsensitive() {
		this.other()
	}
	notContainsCaseInsensitive() {
		this.other()
	}
	startsWithCaseInsensitive() {
		this.other()
	}
	endsWithCaseInsensitive() {
		this.other()
	}
	custom() {
		this.other()
	}
	databaseCustom() {
		this.other()
	}
}

export function extractAxes(where?: Filter): FilterAxes {
	const c = new AxesConsumer()
	where?.__applyToConsumer(c)
	return c.axes
}
