import type { Component } from 'svelte'

import type { FieldMetadata, FieldOptions } from 'remult'

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

export const mergeFieldMetadata = <entityType>(
	metadata: FieldMetadata<unknown, entityType>,
	options: FieldOptions<unknown, entityType>,
) => {
	return {
		...metadata,
		options: {
			...metadata.options,
			ui: {
				...metadata.options.ui,
				...options.ui,
				position: {
					...metadata.options.ui?.position,
					...options.ui?.position,
					mobile: {
						...metadata.options.ui?.position?.mobile,
						...options.ui?.position?.mobile,
					},
				},
			},
		},
	}
}
