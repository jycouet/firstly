import { describe, expect, it } from 'vitest'

import { builtInPresetQueries, mergePresetQueries } from './presetQueries'

const builtInTitles = Object.keys(builtInPresetQueries)

describe('mergePresetQueries', () => {
	it('returns the built-ins by default', () => {
		expect(mergePresetQueries().map((q) => q.title)).toEqual(builtInTitles)
	})

	it('overrides in place, removes with false, appends new titles in order', () => {
		const merged = mergePresetQueries({
			Default: 'SELECT 1',
			Indexes: false,
			'Z added': 'SELECT 2',
			'A added': 'SELECT 3',
		})
		expect(merged).toEqual([
			{ title: 'Default', sql: 'SELECT 1' },
			{ title: 'Tables & Sizes', sql: builtInPresetQueries['Tables & Sizes'] },
			{ title: 'Database Size', sql: builtInPresetQueries['Database Size'] },
			{ title: 'Z added', sql: 'SELECT 2' },
			{ title: 'A added', sql: 'SELECT 3' },
		])
	})
})
