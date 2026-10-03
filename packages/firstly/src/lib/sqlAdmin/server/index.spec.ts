import { describe, expect, it } from 'vitest'

import { SqlAdminController } from '../SqlAdminController'
import { SqlDriftController } from '../SqlDriftController'
import { collectEntities, sqlAdmin } from './index'

describe('sqlAdmin options', () => {
	it('throws on tokens without the controller', () => {
		expect(() => sqlAdmin({ sqlAdmin: false, tokens: { capabilities: ['read'] } })).toThrow(
			/exec endpoint/,
		)
	})
	it('registers nothing with sqlAdmin: false', () => {
		expect(sqlAdmin({ sqlAdmin: false }).controllers).toEqual([])
	})
	it('registers entities only with tokens', () => {
		expect(sqlAdmin().entities).toEqual([])
		expect(sqlAdmin({ tokens: { capabilities: ['read'] } }).entities?.length).toBe(2)
	})
	it('registers drift only with at least one explicit flag', () => {
		const entities = () => []
		expect(sqlAdmin({ drift: { entities } }).controllers).toEqual([SqlAdminController])
		expect(sqlAdmin({ drift: { entities, relationIndexes: true } }).controllers).toEqual([
			SqlAdminController,
			SqlDriftController,
		])
	})
	it('collects entities of nested modules', () => {
		class A {}
		class B {}
		expect(collectEntities([{ entities: [A], modules: [{ entities: [B] }] }])).toEqual([A, B])
	})
})

describe('readOnlyRoleName', () => {
	it('is a safe identifier within 63 chars', async () => {
		const { readOnlyRoleName } = await import('./readOnlyRole')
		expect(readOnlyRoleName('My-App.db')).toBe('ff_readonly_my_app_db')
		expect(readOnlyRoleName('x'.repeat(100)).length).toBe(63)
	})
})
