/**
 *
 * ```ts
 * type KnownTypes = 'password' | 'otp' | 'oAuths' | 'demo'
 *
 * // literal or string
 * const knownType = litOrStr<KnownTypes>('demo')
 * const escapedType = litOrStr('coucou')
 *
 * // literal[] or string[]
 * const knownType = litOrStr<KnownTypes[]>(['demo', 'oAuths'])
 * const escapedType = litOrStr(['hello', 'coucou'])
 * ```
 */
export function litOrStr<T extends string | string[]>(value: T): T {
	return value
}

// removing the Promise of the return type
export type ResolvedType<T> = T extends Promise<infer R> ? R : T

// Remove the array of a type
export type UnArray<T extends any[]> = T extends (infer U)[] ? U : never
