// isComponentObject

import type { FieldMetadata, FieldOptions } from 'remult'

export function deepMerge<T>(target: T, source: Partial<T>): T {
	const result = { ...target }

	if (source && typeof source === 'object' && !Array.isArray(source)) {
		Object.keys(source).forEach((key) => {
			const sourceValue = source[key as keyof typeof source]
			const targetValue = target[key as keyof typeof target]

			if (
				sourceValue &&
				typeof sourceValue === 'object' &&
				!Array.isArray(sourceValue) &&
				targetValue &&
				typeof targetValue === 'object' &&
				!Array.isArray(targetValue)
			) {
				// If both values are objects, recursively merge them
				result[key as keyof typeof result] = deepMerge(targetValue, sourceValue as any) as any
			} else if (sourceValue !== undefined) {
				// Otherwise, just assign the source value
				result[key as keyof typeof result] = sourceValue as any
			}
		})
	}

	return result
}

export function overwriteOptions<valueType = unknown, entityType = unknown>(
	field: FieldMetadata<valueType, entityType>,
	options: FieldOptions<entityType, valueType>,
) {
	return {
		...field,
		// @ts-expect-error
		options: deepMerge(field.options, options),
	}
}
