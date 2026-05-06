import { remult } from 'remult'

/**
 * Row-level allow helpers (for `allowApiUpdate`, `allowApiDelete`, ...).
 *
 * Pair with `FF_Filter` (which is the equivalent for `apiPrefilter`).
 */
export const FF_Allow = {
	/**
	 * Allow only when the row's `col` equals the current user id.
	 * Defaults to `userId`.
	 *
	 * @example
	 * Owner-only update / delete:
	 * ```ts
	 * import { FF_Entity, FF_Allow } from 'firstly'
	 *
	 * \@FF_Entity<Task>('tasks', {
	 *   allowApiUpdate: FF_Allow.owner('userId'),
	 *   allowApiDelete: FF_Allow.owner(),
	 * })
	 * export class Task { ... }
	 * ```
	 *
	 * @example
	 * Admin OR owner (combine with a role):
	 * ```ts
	 * import { remult } from 'remult'
	 * import { FF_Entity, FF_Allow } from 'firstly'
	 * import { Roles } from '$lib/roles'
	 *
	 * \@FF_Entity<Task>('tasks', {
	 *   allowApiUpdate: (t) => remult.isAllowed(Roles.Admin) || FF_Allow.owner<Task>()(t),
	 * })
	 * export class Task { ... }
	 * ```
	 */
	owner:
		<T>(col: keyof T & string = 'userId' as keyof T & string) =>
		(entity?: T) =>
			!!remult.user?.id && (entity as any)?.[col] === remult.user.id,
}
