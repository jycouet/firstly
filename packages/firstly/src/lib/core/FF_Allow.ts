import { remult } from 'remult'

/**
 * Row-level allow helpers (for `allowApiUpdate`, `allowApiDelete`, ...).
 *
 * Pair with `FF_Filter` (the equivalent for `apiPrefilter`).
 *
 * Pass the entity type as a generic (`FF_Allow.owner<Task>('userId')`) to get
 * autocompletion and type-safety on the column name. Without a generic the
 * column is just a `string`.
 */
export const FF_Allow = {
	/**
	 * Allow only when the row's `col` equals the current user id.
	 *
	 * `col` defaults to `'userId'` if omitted.
	 *
	 * @example
	 * Owner-only update / delete (typed):
	 * ```ts
	 * import { FF_Entity, FF_Allow } from 'firstly'
	 *
	 * \@FF_Entity<Task>('tasks', {
	 *   allowApiUpdate: FF_Allow.owner<Task>('userId'), // typed: 'userId' must be a key of Task
	 *   allowApiDelete: FF_Allow.owner<Task>(),        // defaults to 'userId'
	 * })
	 * export class Task { ... }
	 * ```
	 *
	 * For "admin OR owner", prefer `FF_Allow.ownerOr` instead of inlining the
	 * combination yourself.
	 */
	owner:
		<T>(col: keyof T & string = 'userId' as keyof T & string) =>
		(entity?: T) =>
			!!remult.user?.id && (entity as any)?.[col] === remult.user.id,

	/**
	 * Allow when the current user has any of the given `roles`, OR when the
	 * row's `col` equals the current user id.
	 *
	 * `col` defaults to `'userId'` if omitted.
	 *
	 * @example
	 * Admin OR owner (typed):
	 * ```ts
	 * import { FF_Entity, FF_Allow } from 'firstly'
	 * import { Roles } from '$lib/roles'
	 *
	 * \@FF_Entity<Task>('tasks', {
	 *   allowApiUpdate: FF_Allow.ownerOr<Task>({ roles: [Roles.Admin] }),
	 *   allowApiDelete: FF_Allow.ownerOr<Task>({ col: 'createdBy', roles: [Roles.Admin] }),
	 * })
	 * export class Task { ... }
	 * ```
	 */
	ownerOr:
		<T>({ col = 'userId' as keyof T & string, roles }: { col?: keyof T & string; roles: string[] }) =>
		(entity?: T) =>
			roles.some((r) => remult.isAllowed(r)) ||
			(!!remult.user?.id && (entity as any)?.[col] === remult.user.id),
}
