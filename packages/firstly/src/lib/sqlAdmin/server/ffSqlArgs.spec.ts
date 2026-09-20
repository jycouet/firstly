import { describe, expect, it } from 'vitest'

// Plain js, shipped unbuilt next to the bin it serves.
import { parseArgs } from '../../../../bin/args.js'

describe('ff-sql parseArgs', () => {
	it('takes the sql as positionals', () => {
		expect(parseArgs(['select', '1']).sql).toBe('select 1')
		expect(parseArgs([]).sql).toBe('')
	})

	it('reads a value flag written either way', () => {
		expect(parseArgs(['--origin=https://x', 'select 1'])).toMatchObject({
			origin: 'https://x',
			sql: 'select 1',
		})
		expect(parseArgs(['--origin', 'https://x', 'select 1'])).toMatchObject({
			origin: 'https://x',
			sql: 'select 1',
		})
	})

	it('never lets a missing value fall into the sql', () => {
		expect(parseArgs(['--origin']).error).toBe('--origin needs a value')
		expect(parseArgs(['--origin', '--json']).error).toBe('--origin needs a value')
	})

	it('refuses a value on a boolean flag', () => {
		expect(parseArgs(['--json=false']).error).toBe('--json takes no value')
		expect(parseArgs(['--json', 'select 1'])).toMatchObject({ json: true, sql: 'select 1' })
	})

	it('refuses a typo instead of running the query without it', () => {
		expect(parseArgs(['--jsno', 'select 1']).error).toBe('unknown flag --jsno')
	})

	it('knows about help', () => {
		expect(parseArgs(['-h']).help).toBe(true)
		expect(parseArgs(['--help']).help).toBe(true)
	})

	it('maps --api-path to apiPath', () => {
		expect(parseArgs(['--api-path=/backend']).apiPath).toBe('/backend')
	})
})
