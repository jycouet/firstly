import { Entity, isBackend, type EntityOptions } from 'remult'

import type { BaseEnum } from './BaseEnum'
import { recordDeleted, recordSaved } from './changeLog'

const toAllow = (permission: BaseEnum[] | BaseEnum | undefined) => {
	if (permission) {
		if (Array.isArray(permission)) {
			return permission.map((p) => p.id)
		}
		return permission.id
	}
	return undefined
}

export function FF_Entity<entityType>(
	key: string,
	options: EntityOptions<
		entityType extends new (...args: any) => any ? InstanceType<entityType> : entityType
	>,
) {
	return Entity(key, {
		...options,
		allowApiCrud: options.allowApiCrud ?? toAllow(options.permissionApiCrud),
		allowApiDelete: options.allowApiDelete ?? toAllow(options.permissionApiDelete),
		allowApiInsert: options.allowApiInsert ?? toAllow(options.permissionApiInsert),
		allowApiRead: options.allowApiRead ?? toAllow(options.permissionApiRead),
		allowApiUpdate: options.allowApiUpdate ?? toAllow(options.permissionApiUpdate),

		// changesLogs
		saved: async (entity, e) => {
			await options?.saved?.(entity, e)
			if (options.changeLog === false) {
				// Don't log changes
			} else {
				if (isBackend()) {
					await recordSaved(entity, e, options.changeLog)
				}
			}
		},
		deleted: async (entity, e) => {
			await options?.deleted?.(entity, e)
			if (options.changeLog === false) {
				// Don't log changes
			} else {
				if (isBackend()) {
					await recordDeleted(entity, e, options.changeLog)
				}
			}
		},
	})
}
