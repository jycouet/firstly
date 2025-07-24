import {
	Fields,
	Validators,
	type FieldOptions,
	type FieldValidator,
	type StringFieldOptions,
} from 'remult'

import { displayCurrency } from '../formats'
import { getEnums } from './helper'

// Translate default messages
// REMULT P3 JYC: I need to set this here the one of my app are not overwriting these...
// It look like I have 2 remult loaded... But even trying to remove one, I still have the issue
Validators.unique.defaultMessage = 'Existe déjà!'
Validators.required.defaultMessage = 'Obligatoire!'

// export function addValidators(
//   validators: FieldOptions['validate'],
//   newValidator: FieldOptions['validate'],
//   atStart = false,
// ) {
//   if (!newValidator) return validators
//   const newValidators = Array.isArray(newValidator) ? newValidator : [newValidator]
//   const validatorsArray = Array.isArray(validators) ? validators : validators ? [validators] : []
//   return atStart ? [...newValidators, ...validatorsArray] : [...validatorsArray, ...newValidators]
// }

// REMULT P2: A/ Add in the doc that allowNull is false by default
//            B/ Would be great to have a Validators.required automatically when allowNull is not true.
//            C/ WARNING Validators.required is also checking for empty string
const validate_update_when_not_allow_null = <entityType, valueType>(
	o: FieldOptions<entityType, valueType>,
) => {
	const validate: FieldValidator<entityType, valueType>[] = []

	if (
		o.includeInApi !== false &&
		o.serverExpression === undefined &&
		o.sqlExpression === undefined &&
		(o.allowNull === undefined || o.allowNull === false) &&
		// if require: false is explicitly set, then we don't need to add required validator
		o.required !== false
	) {
		// addValidators(o.validate, [Validators.required], true)
		validate.push(Validators.required)
	}

	// let's add original validate if any
	if (o.validate) {
		if (Array.isArray(o.validate)) {
			validate.push(...o.validate)
		} else {
			validate.push(o.validate)
		}
	}

	return validate
}

export class FF_Fields {
	static string<entityType = unknown, valueType = string>(
		o?: StringFieldOptions<entityType, valueType>,
	) {
		if (o === undefined) {
			o = {}
		}

		// let's return the field
		return Fields.string<entityType, valueType>({
			...o,
			validate: validate_update_when_not_allow_null(o),
		})
	}

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

	static dateOnly<entityType = any>(o?: FieldOptions<entityType, Date>) {
		// empty if there is nothing coming here.
		if (o === undefined) {
			o = {}
		}

		o.inputType = 'dateOnly'

		// let's return the field
		return Fields.dateOnly({ ...o, validate: validate_update_when_not_allow_null(o) })
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

					if (typeof v === 'string') {
						return v
							.split(',')
							.map((c: string) => c.replace('{', '').replace('}', ''))
							.map((s: any) => {
								// @ts-ignore
								return enumClass[s] as enumType
							})
					}

					const keys = v
						// @ts-ignore
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
					// Nice to have a oneLiner, but if you want custom style, just take the array and do what you want
					return v.map((c) => c.caption).join(', ')
				},
				// REMULT P2 Noam: how to do this in an official way?
				// @ts-ignore
				values: getEnums(enumClass),
			},
		})
	}
}
