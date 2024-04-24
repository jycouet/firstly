import {
  Fields,
  Validators,
  type FieldOptions,
  type FieldValidator,
  type StringFieldOptions,
} from 'remult'

import { displayCurrencyWOSuffix } from './formats'

// Translate default messages
// REMULT P2: I need to set this here the one of my app are not overwriting these...
// It look like I have 2 remult loaded... But even trying to remove one, I still have the issue
Validators.unique.defaultMessage = 'Existe déjà!'
Validators.required.defaultMessage = 'Obligatoire!'

export function addValidator(
  validators: FieldOptions['validate'],
  newValidator: FieldOptions['validate'],
  atStart = false,
) {
  if (!newValidator) return validators
  const newValidators = Array.isArray(newValidator) ? newValidator : [newValidator]
  const validatorsArray = Array.isArray(validators) ? validators : validators ? [validators] : []
  return atStart ? [...newValidators, ...validatorsArray] : [...validatorsArray, ...newValidators]
}

export class KitFields {
  static string<entityType = any, valueType = string>(
    o?: StringFieldOptions<entityType, valueType> & FieldOptions<entityType, valueType>,
  ) {
    // empty if there is nothing coming here.
    if (o === undefined) {
      o = {}
    }

    const validate: FieldValidator<entityType, valueType>[] = []

    if (
      o.includeInApi !== false &&
      (!o.allowNull || o.required) &&
      // if require: false is explicitly set, then we don't need to add required validator
      o.required !== false
    ) {
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

    // let's return the field
    return Fields.string({ ...o, validate })
  }

  static currency<entityType = any, valueType = any>(
    o?: FieldOptions<entityType> & FieldOptions<entityType>,
  ) {
    // let's return the field
    return Fields.number({ ...o, step: '0.01', suffix: '€', displayValue: displayCurrencyWOSuffix })
  }

  static dateOnly<entityType = any>(o?: FieldOptions<entityType, Date>) {
    // empty if there is nothing coming here.
    if (o === undefined) {
      o = {}
    }

    const validate: FieldValidator<entityType, Date>[] = []

    if (
      o.includeInApi !== false &&
      (!o.allowNull || o.required) &&
      // if require: false is explicitly set, then we don't need to add required validator
      o.required !== false
    ) {
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

    o.inputType = 'dateOnly'

    // let's return the field
    return Fields.dateOnly({ ...o, validate })
  }

  static arrayEnum<enumType = any, entityType = any>(
    enumClass: enumType,
    o?: FieldOptions<entityType, any[]>,
  ) {
    return Fields.json(() => Array<entityType>, {
      ...o,
      inputType: 'selectEnum',
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
          return `{${[...new Set(v.map((c) => c.id))].join(',')}}`
        },
      },
    })
  }
}
