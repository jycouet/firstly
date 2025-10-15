import { Fields, Validators, type ClassType, type FieldOptions } from 'remult'

import { displayCurrency } from '../formats'
import type { BaseEnum } from './BaseEnum'
import { getEnums } from './helper'

// Translate default messages
// REMULT P3 JYC: I need to set this here the one of my app are not overwriting these...
// It look like I have 2 remult loaded... But even trying to remove one, I still have the issue
Validators.unique.defaultMessage = 'Existe déjà!'
Validators.required.defaultMessage = 'Obligatoire!'

export class FF_Fields {
	static currency<entityType = unknown>(o?: FieldOptions<entityType, number>) {
		// let's return the field
		return Fields.number({
			...o,
			step: '0.01',
			suffix: undefined,
			suffixEdit: '€',
			inputType: 'number',
			displayValue: displayCurrency,
			valueConverter: {
				toInput(val, inputType) {
					const valStr = String(val)
					if (valStr.includes('.')) {
						const [left, right] = valStr.split('.')
						// Take only the 2 first digits after the dot
						return `${left}.${right.slice(0, 2)}`
					}
					return valStr
				},
				fromDb(val) {
					if (val) {
						return parseFloat(val.toString())
					}
					return val
				},
			},
		})
	}

	static arrayEnum<enumType = any, entityType = any>(
		enumClass: enumType,
		o?: FieldOptions<entityType, any[]>,
	) {
		return Fields.json(() => Array<entityType>, {
			...o,
			inputType: 'selectArrayEnum',
			allowNull: false,
			valueConverter: {
				fromDb: (v: string) => {
					if (!v) return []
					const keys = v
						.slice(1, -1)
						.split(',')
						.map((s: any) => {
							// @ts-ignore
							return enumClass[s] as enumType
						})
						.filter((p: any) => p !== undefined)
					return keys
				},
				toDb: (v) => {
					const arr = Array.isArray(v) ? v : [v]
					return `{${[...new Set((arr ?? []).map((c) => c.id))].join(',')}}`
				},
				displayValue: (v) => {
					return v.map((c) => c.caption).join(', ')
				},
				// REMULT P2 Noam: how to do this in an official way?
				// @ts-ignore
				values: getEnums(enumClass),
			},
		})
	}

	static arrayEnumToGql<enumType = any, entityType = any>(
		enumClass: enumType,
		o?: FieldOptions<entityType, any[]>,
	) {
		return Fields.json(() => Array<entityType>, {
			...o,
			inputType: 'selectArrayEnum',
			allowNull: false,
			valueConverter: {
				fromDb: (v: string) => {
					if (!v) return []
					const keys = v.slice(1, -1).split(',')
					return keys
				},
				toDb: (v) => {
					const arr = Array.isArray(v) ? v : [v]
					return `{${[...new Set((arr ?? []).map((c) => c.id))].join(',')}}`
				},
				displayValue: (v) => {
					return v.map((c) => c.caption).join(', ')
				},
				// REMULT P2 Noam: how to do this in an official way?
				// @ts-ignore
				values: getEnums(enumClass),
			},
		})
	}

	static arrayValueList<enumType = any, entityType = any>(
		enumClass: ClassType<BaseEnum<any>>,
		o?: FieldOptions<entityType, any[]>,
	) {
		return Fields.json(() => Array<entityType>, {
			...o,
			inputType: 'selectArrayEnum',
			allowNull: false,
			valueConverter: {
				fromDb: (v: string | string[]) => {
					if (!v) return []

					const arr = Array.isArray(v)
						? v
						: v?.split(',').flatMap((c) => c.replaceAll('{', '').replaceAll('}', ''))

					const list = getEnums(enumClass)
					const toRet = []
					for (const s of arr) {
						const found = list.find((c) => c.id === s)
						if (found) {
							toRet.push(found)
						}
					}

					return toRet
				},
				toDb: (v) => {
					const arr = Array.isArray(v) ? v : [v]
					return `{${[...new Set((arr.filter((c) => c !== undefined) ?? []).map((c) => c.id))].join(',')}}`
				},
				displayValue: (v) => {
					// Nice to have a oneLiner, but if you want custom style, just take the array and do what you want
					return v.map((c) => c.caption).join(', ')
				},
				// REMULT P2 Noam: how to do this in an official way?
				// @ts-ignore
				values: getEnums(enumClass),
			},
		})
	}

	static vector32<entityType = unknown>(
		...options: (FieldOptions<entityType, number[]> & { dimensions?: number })[]
	) {
		const dimensions = options[0].dimensions ?? 1024

		return Fields.object<entityType, number[]>(
			{
				valueConverter: {
					fieldTypeInDb: `F32_BLOB(${dimensions})`,
					toDb: (val) => JSON.stringify(val),
					// TODO: remove ts-ignore when remult@3.3.0-next.1 is released (that has toDbSql)
					// @ts-ignore
					toDbSql: (val) => `vector32(${val})`,
					fromDb: (val: Buffer) => Array.from(new Float32Array(val)),
				},
			},
			...options,
		)
	}
}
