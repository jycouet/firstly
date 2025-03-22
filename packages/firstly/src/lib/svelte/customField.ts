import type { Component } from 'svelte'

import type { FieldMetadata } from 'remult'

import { isOfType } from './helpers'

export type FieldMode = 'edit' | 'display'
export type CustomFieldDefaultProps<valueType = unknown, entityType = unknown> = {
	mode: FieldMode
	field: FieldMetadata<valueType, entityType>
	value: valueType
	error?: string
}

type ComponentObject<valueType = unknown, entityType = unknown> = {
	component: Component<CustomFieldDefaultProps<valueType, entityType>>
	props?: Record<string, unknown>
}
export type CustomFieldComponent<valueType = unknown, entityType = unknown> =
	| ComponentObject<valueType, entityType>['component']
	| ComponentObject<valueType, entityType>

export function isComponentObject<valueType = unknown, entityType = unknown>(
	value: CustomFieldComponent<valueType, entityType>,
): value is ComponentObject<valueType, entityType> {
	return isOfType<ComponentObject<valueType, entityType>>(value, 'component')
}

export type DynamicCustomField = <valueType = unknown, entityType = unknown>(
	infos: CustomFieldDefaultProps<valueType, entityType>,
) => CustomFieldComponent<valueType, entityType> | undefined
