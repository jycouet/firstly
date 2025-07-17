import { Module } from 'remult/server'

import type { ColumnDeciderArgs } from '..'
import { ChangeLog } from '../changeLogEntities'

declare module 'remult' {
	export interface EntityOptions<entityType> {
		changeLog?: false | ColumnDeciderArgs<entityType>
	}
}

/**
 * ## Option 1
 * Use the `withChangeLog` function to wrap your entity options.
 *
 * @example
 * ```ts
 * import { withChangeLog } from 'firstly/changeLog'
 *
 * \@Entity('users', withChangeLog({
 *   // ...
 * }))
 * class User { }
 * ```
 * ## Option 2
 * Create your own `@APP_Entity` decorator and use it instead of `@Entity`.
 * Inside, it uses the `withChangeLog` function to wrap your entity options.
 *
 * @example
 * ```ts
 * // APP_Entity.ts example
 * import { Entity, isBackend, type EntityOptions } from 'remult'
 *
 * import { withChangeLog } from 'firstly/changeLog'
 *
 * export function APP_Entity<entityType>(
 * 	key: string,
 * 	options?: EntityOptions<
 * 		entityType extends new (...args: any) => any ? InstanceType<entityType> : entityType
 * 	>,
 * ) {
 * 	return Entity(key, withChangeLog(options))
 * }
 * ```
 */
export const changeLog = () => {
	return new Module({
		key: 'changeLog',
		entities: [ChangeLog],
	})
}
