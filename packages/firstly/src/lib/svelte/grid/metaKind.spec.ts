import { describe, expect, it } from 'vitest'

import { Entity, Field, Fields, Relations, repo, ValueListFieldType } from 'remult'

import { BaseEnum } from '../../core/BaseEnum.js'
import { getFieldMetaType } from './metaKind.js'

@ValueListFieldType()
class Color extends BaseEnum {
	static red = new Color('red', { caption: 'Red' })
	static blue = new Color('blue', { caption: 'Blue' })
}

@Entity('mk_parent')
class Parent {
	@Fields.id() id = ''
	@Fields.string() name = ''
}

@Entity('mk_child')
class Child {
	@Fields.id() id = ''
	@Fields.string() title = ''
	@Fields.number() qty = 0
	@Fields.string({ ui: { inputType: 'select' } }) status = ''
	@Field(() => Color) color = Color.red
	@Relations.toOne(() => Parent) parent?: Parent
}

describe('getFieldMetaType', () => {
	const m = repo(Child).metadata
	it('primitive: a plain string field', () => {
		expect(getFieldMetaType(m.fields.find('title')).kind).toBe('primitive')
		expect(getFieldMetaType(m.fields.find('title')).subKind).toBe('text')
	})
	it('primitive: number keeps inputType subKind', () => {
		expect(getFieldMetaType(m.fields.find('qty')).subKind).toBe('number')
	})
	it('enum: a value-list field is single enum', () => {
		expect(getFieldMetaType(m.fields.find('color')).kind).toBe('enum')
	})
	it('relation: a toOne relation', () => {
		expect(getFieldMetaType(m.fields.find('parent')).kind).toBe('relation')
	})
	it('slot: undefined field', () => {
		expect(getFieldMetaType(undefined).kind).toBe('slot')
	})
})
