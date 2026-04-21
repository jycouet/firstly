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
 *   'px-4 py-2 bg-primary text-primary-foreground',
 *   isDisabled && 'opacity-50 pointer-events-none',
 *   size === 'lg' && 'px-6 text-lg'
 * )
 * ```
 */
export const tw = (...inputs: ClassValue[]) => twMerge(clsx(...inputs))
