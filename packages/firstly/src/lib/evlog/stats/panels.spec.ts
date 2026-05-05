import { render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Browsers from './Browsers.svelte'
import Crud from './Crud.svelte'
import Header from './Header.svelte'
import Modules from './Modules.svelte'
import OsDevices from './OsDevices.svelte'
import PageFlows from './PageFlows.svelte'
import QueriesHot from './QueriesHot.svelte'
import QueriesSlowest from './QueriesSlowest.svelte'
import QueriesTopTime from './QueriesTopTime.svelte'
import TopPages from './TopPages.svelte'
import Totals from './Totals.svelte'
import Traces from './Traces.svelte'

const SAMPLE_QUERY = {
	sql: 'select * from x',
	fullSql: 'select * from x where id = ?',
	count: 3,
	totalMs: 9,
	maxMs: 5,
	avgMs: 3,
	topPaths: [{ path: '/api/x', count: 3 }],
}

const SAMPLE_AUDIT_MONTH = {
	month: '2026-01',
	total: 1,
	creates: 1,
	updates: 0,
	deletes: 0,
	other: 0,
}

const SAMPLE_TRACE_MONTH = {
	month: '2026-01',
	source: 'server' as const,
	count: 5,
	uniqueUsers: 2,
}

describe('stats panels render with non-empty data', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const cases: Array<[string, any, Record<string, unknown>]> = [
		['Browsers', Browsers, { data: [{ name: 'chrome', count: 3, percent: 75 }] }],
		['Crud', Crud, { data: [SAMPLE_AUDIT_MONTH] }],
		['Header', Header, { year: 2026, loading: false, onRefresh: () => {} }],
		['Modules', Modules, { data: [{ month: '2026-01', module: 'tasks', count: 5 }] }],
		[
			'OsDevices',
			OsDevices,
			{
				os: [{ name: 'linux', count: 2, percent: 100 }],
				devices: [{ name: 'desktop', count: 2, percent: 100 }],
			},
		],
		['PageFlows', PageFlows, { data: [{ fromPage: '/a', toPage: '/b', count: 4 }] }],
		['QueriesHot', QueriesHot, { data: [SAMPLE_QUERY] }],
		['QueriesSlowest', QueriesSlowest, { data: [SAMPLE_QUERY] }],
		['QueriesTopTime', QueriesTopTime, { data: [SAMPLE_QUERY] }],
		['TopPages', TopPages, { data: [{ pathname: '/', count: 9, users: 2 }] }],
		['Totals', Totals, { data: { traces: 10, audits: 3, uniqueActors: 2 }, year: 2026 }],
		['Traces', Traces, { data: [SAMPLE_TRACE_MONTH] }],
	]

	for (const [name, Component, props] of cases) {
		it(`<${name}> renders without throwing`, () => {
			const { container } = render(Component, { props })
			expect(container.textContent ?? '').not.toBe('')
		})
	}
})

describe('stats panels render empty state', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const empties: Array<[string, any, Record<string, unknown>]> = [
		['Browsers', Browsers, { data: [] }],
		['Crud', Crud, { data: [] }],
		['Modules', Modules, { data: [] }],
		['PageFlows', PageFlows, { data: [] }],
		['QueriesHot', QueriesHot, { data: [] }],
		['TopPages', TopPages, { data: [] }],
		['Traces', Traces, { data: [] }],
	]
	for (const [name, Component, props] of empties) {
		it(`<${name}> renders without crashing on empty data`, () => {
			expect(() => render(Component, { props })).not.toThrow()
		})
	}
})
