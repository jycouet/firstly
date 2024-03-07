import { getValueList, type IdFilter } from 'remult'
import type { ClassType } from 'remult'

export type KitIcon = {
	data?: string | string[]
	size?: string | number
	class?: string | string[]
	style?: string | string[]
}

export type KitBaseEnumOptions<Entity = any> = {
	caption?: string
	icon?: KitIcon
	where?: IdFilter<Entity>
}

export class KitBaseEnum<Entity = any> {
	public caption?: string
	icon?: KitIcon
	public where?: IdFilter<Entity>

	constructor(
		public id: string,
		options?: KitBaseEnumOptions<Entity>,
	) {
		this.caption = options?.caption ?? id
		this.icon = options?.icon
		this.where = options?.where
	}

	getWhere = () => {
		return this.where ? this.where : this
	}
}

export const getEnum = <T extends KitBaseEnum>(
	baseEnum: ClassType<T>,
	id: string | undefined | null,
) => {
	if (!id) {
		return undefined
	}

	// @ts-ignore
	const found = getValueList(baseEnum).find((c) => c.id === id)
	return found
}

export const getEnums = <T extends KitBaseEnum>(baseEnum: ClassType<T>) => {
	return getValueList(baseEnum) || []
}
