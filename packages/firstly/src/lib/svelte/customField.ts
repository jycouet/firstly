// import { mount, type Component } from 'svelte'

import type { FieldMetadata, FieldOptions } from 'remult'

export type FieldMode = 'edit' | 'display'
export type CustomFieldType<valueType = unknown, entityType = unknown> = {
	mode: FieldMode
	field: FieldMetadata<valueType, entityType>
	value: valueType
	error?: string
}
// export type CustomFieldSnippet<valueType = unknown, entityType = unknown> =
// 	| true
// 	| import('svelte').Snippet<[CustomFieldType<valueType, entityType>]>

// export const createCustomField = <V = unknown, E = unknown>(c: Component<any, any, any>) => {
// 	return (props: CustomFieldType<V, E>) => {
// 		// Handle both client-side and server-side rendering
// 		if (typeof document === 'undefined') {
// 			// Server-side rendering: Return a placeholder element
// 			return `<div data-custom-field></div>`
// 		} else {
// 			// Client-side rendering: Mount the component to a real DOM element
// 			const target = document.createElement('div')
// 			const component = mount(c, { target, props })
// 			return component
// 		}
// 	}
// }

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
