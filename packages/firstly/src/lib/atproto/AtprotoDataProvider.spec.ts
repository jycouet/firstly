import { beforeEach, describe, expect, it } from 'vitest'

import { Entity, Fields, InMemoryDataProvider, Remult } from 'remult'

import { AtprotoDataProvider } from './AtprotoDataProvider.js'
import { AtAny, AtRecord, spaceUri } from './AtRecord.js'
import { AtSpace, AtSpaceMember } from './spaceEntities.js'
import { XrpcError, type XrpcClient } from './xrpc.js'

@Entity<Note>('dev.test.note')
class Note extends AtRecord {
	@Fields.string() title = ''
	@Fields.number() score = 0
	@Fields.date() createdAt = new Date()
}

const ME = 'did:plc:me'
const OTHER = 'did:plc:other'
const SPACE = spaceUri(ME, 'dev.test.workspace', 'main')

/** Enough of a PDS to exercise repo + space + simplespace calls. */
function fakePds() {
	// key: `${space ?? ''}|${did}|${collection}|${rkey}`
	const records = new Map<string, { cid: string; value: any }>()
	const spaces = new Map<string, any>()
	const members = new Map<string, Map<string, { read: boolean; write: boolean }>>()
	const calls: { nsid: string; params?: any; input?: any }[] = []
	let cidSeq = 0
	const cid = () => `cid${++cidSeq}`
	const k = (p: any) => `${p.space ?? ''}|${p.repo}|${p.collection}|${p.rkey}`
	const recordUri = (p: any) =>
		p.space
			? `${p.space}/${p.repo}/${p.collection}/${p.rkey}`
			: `at://${p.repo}/${p.collection}/${p.rkey}`

	const write = (p: any, op: string, value?: any) => {
		const key = k(p)
		if (op === 'delete') return void records.delete(key)
		if (op === 'create' && records.has(key)) throw new XrpcError(400, 'InvalidSwap', 'exists')
		if (p.swapRecord && records.get(key)?.cid !== p.swapRecord)
			throw new XrpcError(400, 'InvalidSwap', 'stale')
		const c = cid()
		records.set(key, { cid: c, value })
		return { uri: recordUri(p), cid: c }
	}

	const xrpc: XrpcClient = {
		async query(nsid, params: any = {}) {
			calls.push({ nsid, params })
			switch (nsid) {
				case 'com.atproto.repo.listRecords':
				case 'com.atproto.space.listRecords': {
					const prefix = `${params.space ?? ''}|${params.repo}|${params.collection}|`
					const all = [...records.entries()]
						.filter(([key]) => key.startsWith(prefix))
						.map(([key, r]) => ({ rkey: key.slice(prefix.length), ...r }))
					all.sort((a, b) => (a.rkey < b.rkey ? 1 : -1))
					if (params.reverse) all.reverse()
					const start = params.cursor ? Number(params.cursor) : 0
					const page = all.slice(start, start + params.limit)
					return {
						records: page.map((r) => ({
							uri: recordUri({ ...params, rkey: r.rkey }),
							cid: r.cid,
							value: r.value,
							rkey: r.rkey,
						})),
						cursor: start + params.limit < all.length ? String(start + params.limit) : undefined,
					}
				}
				case 'com.atproto.repo.getRecord':
				case 'com.atproto.space.getRecord': {
					const r = records.get(k(params))
					if (!r) throw new XrpcError(400, 'RecordNotFound')
					return { uri: recordUri(params), ...r }
				}
				case 'com.atproto.space.listSpaces':
					return { spaces: Array.from(spaces.keys(), (uri) => ({ uri })) }
				case 'com.atproto.simplespace.getSpace': {
					const s = spaces.get(params.space)
					if (!s) throw new XrpcError(400, 'SpaceNotFound')
					return s
				}
				case 'com.atproto.simplespace.listMembers':
					return { members: Array.from(members.get(params.space) ?? [], ([did, m]) => ({ did, ...m })) }
			}
			throw new XrpcError(501, 'MethodNotImplemented', nsid)
		},
		async procedure(nsid, input: any = {}) {
			calls.push({ nsid, input })
			switch (nsid) {
				case 'com.atproto.repo.createRecord':
				case 'com.atproto.space.createRecord':
					return write(input, 'create', input.record)
				case 'com.atproto.repo.putRecord':
				case 'com.atproto.space.putRecord':
					return write(input, 'put', input.record)
				case 'com.atproto.repo.deleteRecord':
				case 'com.atproto.space.deleteRecord':
					return write(input, 'delete')
				case 'com.atproto.repo.applyWrites':
				case 'com.atproto.space.applyWrites':
					return {
						results: input.writes.map((w: any) =>
							write({ ...input, collection: w.collection, rkey: w.rkey }, w.$type.split('#')[1], w.value),
						),
					}
				case 'com.atproto.simplespace.createSpace': {
					const uri = spaceUri(ME, input.type, input.skey ?? 'gen')
					spaces.set(uri, {
						uri,
						readPolicy: input.readPolicy,
						writePolicy: input.writePolicy,
						appAccess: input.appAccess,
					})
					return { uri }
				}
				case 'com.atproto.simplespace.updateSpace':
					spaces.set(input.space, { ...spaces.get(input.space), ...input, uri: input.space })
					return {}
				case 'com.atproto.simplespace.deleteSpace':
					spaces.delete(input.space)
					return {}
				case 'com.atproto.simplespace.putMember': {
					if (!members.has(input.space)) members.set(input.space, new Map())
					members.get(input.space)!.set(input.did, { read: input.read, write: input.write })
					return {}
				}
				case 'com.atproto.simplespace.removeMember':
					members.get(input.space)?.delete(input.did)
					return {}
			}
			throw new XrpcError(501, 'MethodNotImplemented', nsid)
		},
	}
	return { xrpc, records, calls }
}

let pds: ReturnType<typeof fakePds>
let remult: Remult

beforeEach(() => {
	pds = fakePds()
	remult = new Remult(new AtprotoDataProvider({ xrpc: pds.xrpc, did: ME, pageSize: 2 }))
})

describe('records', () => {
	it('inserts into the default repo with a TID and a $type', async () => {
		const n = await remult.repo(Note).insert({ title: 'hello', score: 1 })
		expect(n.did).toBe(ME)
		expect(n.rkey).toHaveLength(13)
		expect(n.uri).toBe(`at://${ME}/dev.test.note/${n.rkey}`)
		expect(n.cid).toBe('cid1')
		const stored = [...pds.records.values()][0].value
		expect(stored.$type).toBe('dev.test.note')
		expect(stored.title).toBe('hello')
		expect(stored.uri).toBeUndefined()
		expect(typeof stored.createdAt).toBe('string')
	})

	it('finds with in-memory where / sort / paging over a paginated listRecords', async () => {
		for (let i = 1; i <= 5; i++)
			await remult.repo(Note).insert({ title: `n${i}`, score: i, rkey: `k${i}` })
		const rows = await remult
			.repo(Note)
			.find({ where: { score: { $gt: 2 } }, orderBy: { score: 'asc' }, limit: 2 })
		expect(rows.map((r) => r.title)).toEqual(['n3', 'n4'])
		expect(await remult.repo(Note).count({ score: { $gte: 4 } })).toBe(2)
		// paginated to the end (pageSize 2)
		expect(pds.calls.filter((c) => c.nsid === 'com.atproto.repo.listRecords').length).toBeGreaterThan(
			1,
		)
	})

	it('pushes did / rkey / space down to the PDS', async () => {
		await remult.repo(Note).insert({ title: 'mine', rkey: 'a' })
		await remult.repo(Note).insert({ title: 'theirs', did: OTHER, rkey: 'b' })
		await remult.repo(Note).insert({ title: 'draft', rkey: 'c', space: SPACE })

		expect((await remult.repo(Note).find()).map((n) => n.title)).toEqual(['mine'])
		expect(
			(await remult.repo(Note).find({ where: { did: [ME, OTHER] } })).map((n) => n.title).sort(),
		).toEqual(['mine', 'theirs'])
		expect((await remult.repo(Note).find({ where: { space: SPACE } })).map((n) => n.title)).toEqual([
			'draft',
		])
		pds.calls.length = 0
		expect((await remult.repo(Note).findId(`at://${OTHER}/dev.test.note/b`))?.title).toBe('theirs')
		expect(pds.calls.map((c) => c.nsid)).toEqual(['com.atproto.repo.getRecord'])
		// $or of dids = one listing per did, the rest filtered in memory
		const or = await remult
			.repo(Note)
			.find({ where: { $or: [{ did: ME, title: 'mine' }, { did: OTHER }] } })
		expect(or.map((n) => n.title).sort()).toEqual(['mine', 'theirs'])
	})

	it('uses a raw PDS page when only limit is asked', async () => {
		for (let i = 1; i <= 5; i++) await remult.repo(Note).insert({ title: `n${i}`, rkey: `k${i}` })
		pds.calls.length = 0
		const rows = await remult.repo(Note).find({ limit: 2 })
		expect(rows.map((r) => r.rkey)).toEqual(['k5', 'k4'])
		expect(pds.calls).toHaveLength(1)
		expect(pds.calls[0].params.limit).toBe(2)
		// the grid's "rkey desc, uri asc" tie-breaker and a NaN page (REST without _page) are still native
		pds.calls.length = 0
		const p2 = await remult
			.repo(Note)
			.find({ limit: 2, page: NaN, orderBy: { rkey: 'desc', uri: 'asc' } })
		expect(p2.map((r) => r.rkey)).toEqual(['k5', 'k4'])
		expect(pds.calls).toHaveLength(1)
		expect(pds.calls[0].params.limit).toBe(2)
	})

	it('updates with swapRecord, deletes', async () => {
		const n = await remult.repo(Note).insert({ title: 'v1', rkey: 'a' })
		const u = await remult.repo(Note).update(n.uri, { title: 'v2' })
		expect(u.title).toBe('v2')
		const put = pds.calls.find((c) => c.nsid === 'com.atproto.repo.putRecord')!
		expect(put.input.swapRecord).toBe('cid1')
		expect(put.input.record).toMatchObject({ $type: 'dev.test.note', title: 'v2', score: 0 })
		await remult.repo(Note).delete(u.uri)
		expect(pds.records.size).toBe(0)
	})

	it('maps InvalidSwap to a 409 EntityError', async () => {
		await remult.repo(Note).insert({ title: 'x', rkey: 'dup' })
		await expect(remult.repo(Note).insert({ title: 'y', rkey: 'dup' })).rejects.toMatchObject({
			httpStatusCode: 409,
		})
	})

	it('draft -> publish is a plain insert with the same rkey', async () => {
		const draft = await remult.repo(Note).insert({ title: 'wip', space: SPACE })
		const pub = await remult.repo(Note).insert({ ...draft, space: null })
		expect(pub.uri).toBe(`at://${ME}/dev.test.note/${draft.rkey}`)
		expect(draft.uri.startsWith(SPACE)).toBe(true)
	})

	it('commits a transaction as one applyWrites', async () => {
		await remult.repo(Note).insert({ title: 'old', rkey: 'old' })
		await remult.dataProvider.transaction(async (dp) => {
			const r = new Remult(dp)
			await r.repo(Note).insert({ title: 'a', rkey: 'a' })
			await r.repo(Note).insert({ title: 'b', rkey: 'b' })
			await r.repo(Note).delete(`at://${ME}/dev.test.note/old`)
		})
		const aw = pds.calls.filter((c) => c.nsid === 'com.atproto.repo.applyWrites')
		expect(aw).toHaveLength(1)
		expect(aw[0].input.writes.map((w: any) => w.$type.split('#')[1])).toEqual([
			'create',
			'create',
			'delete',
		])
		expect(Array.from(pds.records.keys(), (k) => k.split('|')[3]).sort()).toEqual(['a', 'b'])
	})

	it('refuses a transaction across repos', async () => {
		await expect(
			remult.dataProvider.transaction(async (dp) => {
				const r = new Remult(dp)
				await r.repo(Note).insert({ title: 'a' })
				await r.repo(Note).insert({ title: 'b', did: OTHER })
			}),
		).rejects.toThrow(/one repo/)
		expect(pds.records.size).toBe(0)
	})
})

describe('AtAny + count cap', () => {
	it('reads and writes any collection through AtAny', async () => {
		await remult.repo(Note).insert({ title: 'typed', rkey: 'a' })
		const any = await remult
			.repo(AtAny)
			.insert({ collection: 'dev.other.thing', rkey: 'b', value: { foo: 1 } })
		expect(any.uri).toBe(`at://${ME}/dev.other.thing/b`)
		const notes = await remult.repo(AtAny).find({ where: { did: ME, collection: 'dev.test.note' } })
		expect(notes).toHaveLength(1)
		expect(notes[0].value).toMatchObject({ $type: 'dev.test.note', title: 'typed' })
		const u = await remult.repo(AtAny).update(any.uri, { value: { foo: 2 } })
		expect(u.value).toEqual({ $type: 'dev.other.thing', foo: 2 })
		await remult.repo(AtAny).delete(any.uri)
		await expect(remult.repo(AtAny).find({ where: { did: ME } })).rejects.toThrow(/collection/)
	})

	it('stops counting at maxCount', async () => {
		remult = new Remult(
			new AtprotoDataProvider({ xrpc: pds.xrpc, did: ME, pageSize: 2, maxCount: 4 }),
		)
		for (let i = 1; i <= 9; i++) await remult.repo(Note).insert({ title: `n${i}`, rkey: `k${i}` })
		pds.calls.length = 0
		expect(await remult.repo(Note).count()).toBe(4)
		expect(pds.calls).toHaveLength(2)
		// a non-pushable where still has to see everything
		expect(await remult.repo(Note).count({ title: { $contains: 'n' } })).toBe(9)
	})
})

describe('spaces', () => {
	it('creates, lists, updates and deletes a space', async () => {
		const s = await remult.repo(AtSpace).insert({
			type: 'dev.test.workspace',
			skey: 'main',
			readPolicy: 'member-list',
			writePolicy: 'public',
		})
		expect(s.uri).toBe(SPACE)
		expect(s.authority).toBe(ME)
		expect(s.writePolicy).toBe('public')
		expect((await remult.repo(AtSpace).find()).map((x) => x.uri)).toEqual([SPACE])
		const u = await remult
			.repo(AtSpace)
			.update(SPACE, { appAccess: 'allow-list', allowedApps: ['https://app.example'] })
		expect(u.allowedApps).toEqual(['https://app.example'])
		expect(pds.calls.at(-1)?.input.appAccess).toEqual({
			$type: 'com.atproto.simplespace.defs#allowList',
			allowed: ['https://app.example'],
		})
		await remult.repo(AtSpace).delete(SPACE)
		expect(await remult.repo(AtSpace).count()).toBe(0)
	})

	it('manages members', async () => {
		await remult.repo(AtSpaceMember).insert({ space: SPACE, did: OTHER })
		expect(await remult.repo(AtSpaceMember).find({ where: { space: SPACE } })).toMatchObject([
			{ did: OTHER, read: true, write: true },
		])
		await remult.repo(AtSpaceMember).update({ space: SPACE, did: OTHER }, { write: false })
		expect((await remult.repo(AtSpaceMember).findFirst({ space: SPACE }))?.write).toBe(false)
		await remult.repo(AtSpaceMember).delete({ space: SPACE, did: OTHER })
		expect(await remult.repo(AtSpaceMember).count({ space: SPACE })).toBe(0)
	})
})

describe('sanity', () => {
	it('the same entity works on InMemoryDataProvider (no provider lock-in)', async () => {
		const r = new Remult(new InMemoryDataProvider())
		const n = await r.repo(Note).insert({ uri: 'x', title: 'plain' })
		expect((await r.repo(Note).findId('x'))?.title).toBe(n.title)
	})
})
