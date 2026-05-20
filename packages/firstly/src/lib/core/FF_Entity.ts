import { Entity, type EntityOptions } from 'remult'

import { withChangeLog } from '../changeLog'

export function FF_Entity<entityType>(
	key: string,
	options?: EntityOptions<
		entityType extends new (...args: any) => any ? InstanceType<entityType> : entityType
	>,
): ReturnType<typeof Entity<entityType>> {
	return Entity(key, withChangeLog({ ...options }))
}
