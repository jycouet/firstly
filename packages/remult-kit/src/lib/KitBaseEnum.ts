import { getValueList, type IdFilter } from 'remult'
import type { ClassType, FindOptionsBase } from 'remult'

export type KitIcon = {
  data?: string | string[]
  size?: string | number
  class?: string | string[]
  style?: string | string[]
  caption?: string
}

export type KitBaseEnumOptions<Entity = any> = {
  caption?: string
  icon?: KitIcon
  where?: IdFilter<Entity> | FindOptionsBase<Entity>['where']
  class?: string
}

export class KitBaseEnum<Entity = any> {
  public id: string
  public caption?: string
  icon?: KitIcon
  public where?: IdFilter<Entity> | FindOptionsBase<Entity>['where']
  public class?: string

  constructor(_id: string | number, options?: KitBaseEnumOptions<Entity>) {
    this.id = _id.toString()
    this.caption = options?.caption ?? this.id
    this.icon = options?.icon
    this.where = options?.where
    this.class = options?.class

    if (options?.icon && options.icon.caption === undefined) {
      options.icon.caption = options?.caption
    }
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
