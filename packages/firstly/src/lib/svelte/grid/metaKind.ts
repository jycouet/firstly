import type { FieldMetadata, Repository } from 'remult'
import { getRelationFieldInfo } from 'remult/internals'

import type { BaseEnum } from '../../core/BaseEnum.js'

export type FieldMetaType =
	| {
			kind: 'relation'
			subKind: 'reference' | 'toOne' | 'toMany'
			repoTarget: Repository<unknown>
			field: FieldMetadata
	  }
	| { kind: 'enum'; subKind: 'single' | 'multi'; values: BaseEnum[]; field: FieldMetadata }
	| { kind: 'primitive'; subKind: string; field: FieldMetadata }
	| { kind: 'slot'; subKind: 'unknown' }

/**
 * Derive a render "kind" from a remult FieldMetadata.
 * Mirrors my-minion's old_ff getFieldMetaType (the renderer brain), minus the daisyUI bits.
 * Note: value-lists are read off `options.valueConverter.values` directly - `getValueList(field)`
 * throws "ValueType not yet initialized" here, so don't use it.
 */
export function getFieldMetaType(field?: FieldMetadata, withHidden = false): FieldMetaType {
	if (field === undefined) return { kind: 'slot', subKind: 'unknown' }

	const rel = getRelationFieldInfo(field)
	if (rel) {
		return {
			kind: 'relation',
			subKind: rel.type,
			repoTarget: rel.toRepo as Repository<unknown>,
			field,
		}
	}

	const opts = field.options as { inputType?: string; valueConverter?: { values?: BaseEnum[] } }
	if (opts?.inputType === 'selectArrayEnum') {
		return { kind: 'enum', subKind: 'multi', values: opts.valueConverter?.values ?? [], field }
	}
	if (opts?.valueConverter?.values) {
		const values = opts.valueConverter.values
		return {
			kind: 'enum',
			subKind: 'single',
			values: withHidden ? values : values.filter((v) => !(v as BaseEnum & { hide?: boolean }).hide),
			field,
		}
	}
	return { kind: 'primitive', subKind: field.inputType ?? 'text', field }
}
