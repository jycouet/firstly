import { Module } from 'remult/server'

import { ChangeLog } from '../changeLogEntities'

/**
 * We suggest you to create your own `@APP_Entity` decorator and use it instead of `@Entity`.
 * Like this you opt-in to the change log feature Entity by Entity.
 *
 * @example
 * ```ts
 * // APP_Entity.ts example
 * import { Entity, isBackend, type EntityOptions } from 'remult'
 *
 * import { recordDeleted, recordSaved } from 'firstly/changeLog'
 *
 * export function APP_Entity<entityType>(
 * 	key: string,
 * 	options?: EntityOptions<
 * 		entityType extends new (...args: any) => any ? InstanceType<entityType> : entityType
 * 	>,
 * ) {
 * 	return Entity(key, {
 * 		...options,
 *
 * 		// changesLogs
 * 		saved: async (entity, e) => {
 * 			await options?.saved?.(entity, e)
 * 			if (options?.changeLog === false) {
 * 				// Don't log changes
 * 			} else {
 * 				if (isBackend()) {
 * 					await recordSaved(entity, e, options?.changeLog)
 * 				}
 * 			}
 * 		},
 * 		deleted: async (entity, e) => {
 * 			await options?.deleted?.(entity, e)
 * 			if (options?.changeLog === false) {
 * 				// Don't log changes
 * 			} else {
 * 				if (isBackend()) {
 * 					await recordDeleted(entity, e, options?.changeLog)
 * 				}
 * 			}
 * 		},
 * 	})
 * }
 * ```
 */
export const changeLog = () => {
	return new Module({
		key: 'changeLog',
		entities: [ChangeLog],
	})
}
