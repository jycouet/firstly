import { remult } from 'remult'

/**
 * Prefilter helpers (for `apiPrefilter`, `backendPrefilter`).
 *
 * Pair with `FF_Allow` (which is the equivalent for `allowApi*` row checks).
 */
export const FF_Filter = {
	/**
	 * Prefilter rows where `col` equals the current user id. Defaults to `userId`.
	 * When anonymous, yields `IN (NULL)` which matches nothing.
	 *
	 * @example
	 * Owner-only prefilter:
	 * ```ts
	 * import { FF_Entity, FF_Filter } from 'firstly'
	 *
	 * \@FF_Entity<Task>('tasks', {
	 *   apiPrefilter: () => FF_Filter.owner<Task>('userId'),
	 * })
	 * export class Task { ... }
	 * ```
	 *
	 * @example
	 * Admin sees all, others only their own:
	 * ```ts
	 * import { remult } from 'remult'
	 * import { FF_Entity, FF_Filter } from 'firstly'
	 * import { Roles } from '$lib/roles'
	 *
	 * \@FF_Entity<Task>('tasks', {
	 *   apiPrefilter: () => {
	 *     if (remult.isAllowed(Roles.Admin)) return {}
	 *     return FF_Filter.owner<Task>()
	 *   },
	 * })
	 * export class Task { ... }
	 * ```
	 */
	owner: <T>(col: keyof T & string = 'userId' as keyof T & string) =>
		({ [col]: [remult.user?.id] }) as any,
}
