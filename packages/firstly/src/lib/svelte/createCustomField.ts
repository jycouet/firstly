import { createRawSnippet, mount, unmount, type Component } from 'svelte'

import type { FieldMetadata } from 'remult'

export type CustomFieldType<valueType = unknown, entityType = unknown> = { field: FieldMetadata<valueType, entityType>, value: valueType, error?: string }
export type CustomFieldSnippet<valueType = unknown, entityType = unknown> = true | import('svelte').Snippet<[CustomFieldType<valueType, entityType>]>

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
