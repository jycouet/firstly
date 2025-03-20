import { createRawSnippet, mount, unmount, type Component } from 'svelte'

import type { FieldMetadata, FieldOptions } from 'remult'

export type FieldMode = 'edit' | 'display'
export type CustomFieldType<valueType = unknown, entityType = unknown> = {
	mode: FieldMode
	field: FieldMetadata<valueType, entityType>
	value: valueType
	error?: string
}
export type CustomFieldSnippet<valueType = unknown, entityType = unknown> =
	| true
	| import('svelte').Snippet<[CustomFieldType<valueType, entityType>]>

export const createCustomField = (c: Component<any, any, any>) =>
	createRawSnippet<[CustomFieldType]>((getArgs) => {
		return {
			render: () => `<div></div>`,
			setup: (node) => {
				const comp = mount(c, { target: node, props: getArgs() })
				return () => unmount(comp)
			},
		}
	})

export const mergeFieldMetadata = <entityType, valueType>(
	metadata: FieldMetadata<entityType, valueType>,
	options: FieldOptions<entityType, valueType>,
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
