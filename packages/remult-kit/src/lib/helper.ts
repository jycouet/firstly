import { type ErrorInfo, type FieldMetadata, type Repository } from 'remult'
import { getRelationFieldInfo } from 'remult/internals'
import { green, Log, yellow } from '@kitql/helpers'

import { suffixWithS } from './formats/strings.js'
import type { KitBaseItem } from './index.js'

const log = new Log('remult-kit')

export function isError<T>(object: any): object is ErrorInfo<T> {
	return object
}

export const getRepoDisplayValue = <Entity>(
	// for the developer!
	whereAreWe: string,
	repo: Repository<Entity>,
	row: Entity,
): KitBaseItem => {
	if (!repo.metadata.options.displayValue) {
		log.error(
			`(${whereAreWe}) Entity "${green(repo.metadata.key)}"` +
				` missing "${yellow(`displayValue`)}" prop.`,
		)
		return { caption: 'NOTHING', id: 'NOTHING' }
	}
	return repo.metadata.options.displayValue(row)
}

export type MetaTypeRelation = {
	kind: 'relation'
	subKind: 'reference' | 'toOne' | 'toMany'
	repoTarget: Repository<any>
	field: FieldMetadata
}
type MetaTypeEnum = {
	kind: 'enum'
	subKind: '???'
	values: KitBaseItem[]
	field: FieldMetadata
}
type MetaTypePrimitive = {
	kind: 'primitive'
	subKind: string
	field: FieldMetadata
}
type MetaTypeSlot = { kind: 'slot'; subKind: '???' }
export type FieldMetaType = MetaTypeRelation | MetaTypeEnum | MetaTypePrimitive | MetaTypeSlot

// or it's a slot or it will return the field
export const getFieldMetaType = (field?: FieldMetadata): FieldMetaType => {
	if (field === undefined) {
		return { kind: 'slot', subKind: '???' }
	}
	// is it a relation?
	const fieldRelationInfo = getRelationFieldInfo(field)
	if (fieldRelationInfo) {
		return {
			kind: 'relation',
			subKind: fieldRelationInfo.type,
			repoTarget: fieldRelationInfo.toRepo,
			field,
		}
	}

	// REMULT TODO
	// is it any enum?
	// @ts-ignore
	if (field.options?.valueConverter?.values) {
		return {
			kind: 'enum',
			subKind: '???',
			// @ts-ignore
			values: field.options.valueConverter.values as KitBaseItem[],
			field,
		}
	}

	// it's a primitive
	return { kind: 'primitive', subKind: field.inputType ?? 'text', field }
}

export const displayWithDefaultAndSuffix = (
	field: FieldMetadata<any, any> | undefined,
	value: any,
) => {
	const toRet = []
	// TODO: This method should be reviewed. Specifically, server expression & Field.date have
	// valueConverter by defualt, so we can't use displayValue if checking for valueConverter
	// Hummm... JYC: I didn't understand the above comment.
	if (field && field.valueConverter?.displayValue && !field.isServerExpression) {
		toRet.push(field.valueConverter?.displayValue(value) ?? '-')
	} else {
		// toRet.push(value ?? '-')
		toRet.push(field?.displayValue ? field?.displayValue({ [field.key]: value }) : value ?? '-')
	}

	if (value === undefined || value === null) {
		return ''
	}

	if (field?.options.suffix) {
		if (field.options.suffixWithS) {
			toRet.push(suffixWithS(value, field.options.suffix))
		} else {
			toRet.push(field.options.suffix)
		}
	}
	return toRet.join(' ')
}
