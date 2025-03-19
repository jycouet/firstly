import type { FieldMetadata, FieldOptions } from "remult"

export const mergeFieldMetadata = <entityType, valueType>(metadata: FieldMetadata<entityType, valueType>, options: FieldOptions<entityType, valueType>) => {
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
