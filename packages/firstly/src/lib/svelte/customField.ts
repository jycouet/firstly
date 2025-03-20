import type { Component } from 'svelte'

import type { FieldMetadata, FieldOptions } from 'remult'

export type FieldMode = 'edit' | 'display'
export type CustomFieldDefaultProps<valueType = unknown, entityType = unknown> = {
	mode: FieldMode
	field: FieldMetadata<valueType, entityType>
	value: valueType
	error?: string
}

/**
 * Type guard to check if a CustomFieldComponent is an object with a component property
 */
export function isComponentObject<valueType = unknown, entityType = unknown>(
	customField: CustomFieldComponent<valueType, entityType>
): customField is {
	component: Component<CustomFieldDefaultProps<valueType, entityType>>
	props?: any
	// rowToProps?: (row: any) => any
} {
	return typeof customField === 'object' && 'component' in customField;
}

export type CustomFieldComponent<valueType = unknown, entityType = unknown> =
	Component<
		CustomFieldDefaultProps<valueType, entityType>
	> | {
		component: Component<
			CustomFieldDefaultProps<valueType, entityType>
		>
		props?: any
		// rowToProps?: (row: any) => any
	}

// Define the custom field function type
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
