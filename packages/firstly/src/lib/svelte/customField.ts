import type { FieldMetadata, FieldOptions } from 'remult'
import type { Component } from 'svelte'

export type FieldMode = 'edit' | 'display'
export type CustomFieldDefaultProps<valueType = unknown, entityType = unknown> = {
	mode: FieldMode
	field: FieldMetadata<valueType, entityType>
	value: valueType
	error?: string
}

// props?: any
// 	rowToProps?: (row: any) => any
export type CustomFieldComponent<valueType = unknown, entityType = unknown> = Component<CustomFieldDefaultProps<valueType, entityType>>


// Define the custom field function type
export type DynamicCustomField = <valueType, entityType>(infos: CustomFieldDefaultProps<valueType, entityType>) => Component<CustomFieldDefaultProps<valueType, entityType>> | undefined


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
