const TAG_ID = 'ff-replay'
const REPLAY_MS = 5000
const LESS_THAN = /</g
const READ_ACTION = /__action=(get|groupBy)/

export type Reads = Record<string, { status: number; body: string }[]>

const methodOf = (init?: RequestInit) => (init?.method ?? 'GET').toUpperCase()

// remult POSTs reads when the filter is too long for a query string.
const isRead = (input: RequestInfo | URL, init?: RequestInit) =>
	methodOf(init) === 'GET' || (methodOf(init) === 'POST' && READ_ACTION.test(String(input)))

const keyOf = (input: RequestInfo | URL, init?: RequestInit) =>
	`${String(input)}|${typeof init?.body === 'string' ? init.body : ''}`

/** Server: keeps every read response of this request. */
export const recordReads =
	(base: typeof fetch, reads: Reads): typeof fetch =>
	async (input, init) => {
		const res = await base(input, init)
		if (isRead(input, init))
			(reads[keyOf(input, init)] ??= []).push({
				status: res.status,
				body: await res.clone().text(),
			})
		return res
	}

/** Server: a data block, so a strict CSP doesn't need a nonce for it. */
export const replayTag = (reads: Reads) =>
	Object.keys(reads).length === 0
		? ''
		: `<script type="application/json" id="${TAG_ID}">${JSON.stringify(reads).replace(LESS_THAN, '\\u003c')}</script>`

/** Browser: same url as the server, so each saved read answers one request. */
export const replayReads = (base: typeof fetch, read = readTag): typeof fetch => {
	const start = Date.now()
	let reads: Reads | undefined
	return async (input, init) => {
		reads ??= read()
		if (!isRead(input, init)) {
			// A write outdates whatever the server rendered.
			reads = {}
			return base(input, init)
		}
		const hit = reads[keyOf(input, init)]?.shift()
		return hit && Date.now() - start < REPLAY_MS
			? new Response(hit.body, {
					status: hit.status,
					headers: { 'content-type': 'application/json' },
				})
			: base(input, init)
	}
}

const readTag = () => JSON.parse(document.getElementById(TAG_ID)?.textContent ?? '{}') as Reads
