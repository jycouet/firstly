import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes using clsx and tailwind-merge.
 * This utility helps combine conditional classes and resolves conflicts.
 *
 * @param inputs - Class values to merge (strings, objects, arrays, etc.)
 * @returns A merged string of Tailwind classes
 *
 * @example
 * ```typescript
 * import { tw } from './tailwind'
 *
 * const buttonClasses = tw(
 *   'btn btn-primary',
 *   isDisabled && 'btn-disabled',
 *   size === 'lg' && 'btn-lg'
 * )
 * // Result: "btn btn-primary btn-disabled" (if isDisabled is true)
 * ```
 */
export const tw = (...inputs: ClassValue[]) => twMerge(clsx(...inputs))
