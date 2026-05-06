import { remult } from 'remult'

/**
 * Prefilter helpers (for `apiPrefilter`, `backendPrefilter`).
 *
 * Pair with `FF_Allow` (the equivalent for `allowApi*` row checks).
 *
 * Pass the entity type as a generic (`FF_Filter.owner<Task>('userId')`) to get
 * autocompletion and type-safety on the column name. Without a generic the
 * column is just a `string`.
 */
export const FF_Filter = {
	/**
	 * Prefilter rows where `col` equals the current user id.
	 *
	 * `col` defaults to `'userId'` if omitted. When anonymous, yields
	 * `IN (NULL)` which matches nothing.
	 *
	 * @example
	 * Owner-only prefilter (typed):
	 * ```ts
	 * import { FF_Entity, FF_Filter } from 'firstly'
	 *
	 * \@FF_Entity<Task>('tasks', {
	 *   apiPrefilter: () => FF_Filter.owner<Task>('userId'),
	 * })
	 * export class Task { ... }
	 * ```
	 *
	 * For "admin sees all, others see only their own", prefer
	 * `FF_Filter.ownerOr` instead of inlining the combination yourself.
	 */
	owner: <T>(col: keyof T & string = 'userId' as keyof T & string) =>
		({ [col]: [remult.user?.id] }) as any,

	/**
	 * Prefilter that returns `{}` (no filter) when the current user has any of
	 * the given `roles`, otherwise restricts to rows where `col` equals the
	 * current user id.
	 *
	 * `col` defaults to `'userId'` if omitted.
	 *
	 * @example
	 * Admin sees all, others only their own (typed):
	 * ```ts
	 * import { FF_Entity, FF_Filter } from 'firstly'
	 * import { Roles } from '$lib/roles'
	 *
	 * \@FF_Entity<Task>('tasks', {
	 *   apiPrefilter: () => FF_Filter.ownerOr<Task>({ roles: [Roles.Admin] }),
	 * })
	 * export class Task { ... }
	 * ```
	 */
	ownerOr: <T>({
		col = 'userId' as keyof T & string,
		roles,
	}: {
		col?: keyof T & string
		roles: string[]
	}) => {
		if (roles.some((r) => remult.isAllowed(r))) return {} as any
		return { [col]: [remult.user?.id] } as any
	},
}
