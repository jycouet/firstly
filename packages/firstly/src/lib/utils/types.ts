// removing the Promise of the return type
export type ResolvedType<T> = T extends Promise<infer R> ? R : T

// Remove the array of a type
export type UnArray<T extends any[]> = T extends (infer U)[] ? U : never
