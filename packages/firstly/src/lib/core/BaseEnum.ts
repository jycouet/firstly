import type { FindOptionsBase, Repository } from 'remult'

export type BaseItemLight = Partial<BaseItem>

/** Lucide's icon shape (`import { Skull } from 'lucide'`): `[tag, attrs][]`, stroke-drawn, viewBox 24. */
export type IconNode = [tag: string, attrs: Record<string, string | number | undefined>][]

/** `d` path(s) (mdi style, fill), an `<svg>` string, or a Lucide {@link IconNode} (stroke). */
export type IconData = string | string[] | IconNode

export type FF_Icon = {
	data?: IconData
	size?: string | number
	class?: string | string[]
	style?: string | string[]
	caption?: string
}

export type BaseItem = BaseEnumOptions & {
	id: string | null
	captionSub?: string | (string | undefined)[]
	href?: string
	repo?: Repository<any>
	sub?: {
		captionPre?: string
		repo?: Repository<any>
		items?: any[]
	}
}

export type BaseEnumOptions<Entity = any> = {
	caption?: string
	icon?: FF_Icon
	where?: FindOptionsBase<Entity>['where']
	class?: string
	hide?: boolean
}

export class BaseEnum<Entity = any> {
	public id: string
	public caption?: string
	icon?: FF_Icon
	public where?: FindOptionsBase<Entity>['where']
	public class?: string
	public hide?: boolean
	constructor(_id: string | number, options?: BaseEnumOptions<Entity>) {
		this.id = _id.toString()
		this.caption = options?.caption ?? this.id
		this.icon = options?.icon
		this.where = options?.where
		this.class = options?.class
		this.hide = options?.hide

		if (options?.icon && options.icon.caption === undefined) {
			options.icon.caption = options?.caption
		}
	}
}
