import { Module } from '../../api'
import { ChangeLog } from '../index'

/**
 * ## Default way
 * The easiest is to switch from `@Entity` to `@FF_Entity` to the entities where you want to log changes.
 *
 * ```ts
 * \@FF_Entity<User>('users', {
 *
 *   // Optional => To disable change logs
 *   // changeLog: false,
 *
 *   // Optional => To disable some columns from being logged
 *   // changeLog: {
 *   //   excludeColumns: (e) => {
 *   //     return [e.password]
 *   //   },
 *   // },
 * })
 * export class User {}
 * ```
 *
 * ## Manual way
 * If you want to go more manual, you can import these functions and call them in your entity's lifecycle events.
 * ```ts
 * \@Entity<User>('users', {
 *   saved: async (entity, e) => {
 *     await recordSaved(entity, e)
 *   },
 *   deleted: async (entity, e) => {
 *     await recordDeleted(entity, e)
 *   },
 * })
 * export class User {}
 * ```
 */
export const changeLog: () => Module = () => {
  return new Module({
    name: 'changeLog',
    entities: [ChangeLog],
  })
}
