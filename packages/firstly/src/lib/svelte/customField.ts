import type { Component } from 'svelte'

import type { FieldMetadata } from 'remult'

export type FieldMode = 'edit' | 'display'
export type CustomFieldDefaultProps<valueType = unknown, entityType = unknown> = {
	mode: FieldMode
	field: FieldMetadata<valueType, entityType>
	value: valueType
	error?: string
}

// TODO: make this a generic something ?
export function isComponentObject<valueType, entityType>(
	customField: CustomFieldComponent<valueType, entityType>,
): customField is ComponentObject<valueType, entityType> {
	return typeof customField === 'object' && 'component' in customField
}

type ComponentObject<valueType, entityType> = {
	component: Component<CustomFieldDefaultProps<valueType, entityType>>
	props?: any
}
export type CustomFieldComponent<valueType = unknown, entityType = unknown> =
	| ComponentObject<valueType, entityType>['component']
	| ComponentObject<valueType, entityType>

export type DynamicCustomField = <valueType, entityType>(
	infos: CustomFieldDefaultProps<valueType, entityType>,
) => CustomFieldComponent<valueType, entityType> | undefined
