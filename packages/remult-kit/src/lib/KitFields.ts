import {
  Fields,
  Validators,
  type FieldOptions,
  type FieldValidator,
  type StringFieldOptions,
} from 'remult'

import { displayCurrencyWOSuffix } from './formats'

export class KitFields {
  static string<entityType = any, valueType = any>(
    o?: StringFieldOptions<entityType> & FieldOptions<entityType>,
  ) {
    // empty if there is nothing coming here.
    if (o === undefined) {
      o = {}
    }

    const validate: FieldValidator<entityType, string>[] = []

    if (
      (!o.allowNull || o.required) &&
      // if require: false is explicitly set, then we don't need to add required validator
      o.required !== false
    ) {
      validate.push(Validators.required('Obligatoire!'))
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
    if (!o.allowNull || o.required) {
      validate.push(Validators.required('Obligatoire!'))
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
