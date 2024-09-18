import type { FindOptionsBase, Repository } from 'remult'

export type FF_Icon = {
  data?: string | string[]
  size?: string | number
  class?: string | string[]
  style?: string | string[]
  caption?: string
}

export type BaseItem = BaseEnumOptions & {
  id: string
  captionSub?: string | (string | undefined)[]
  href?: string
  repo?: Repository<any>
  sub?: {
    captionPre?: string
    repo?: Repository<any>
    item?: any
  }
}

export type BaseEnumOptions<Entity = any> = {
  caption?: string
  icon?: FF_Icon
  where?: FindOptionsBase<Entity>['where']
  class?: string
}

export class BaseEnum<Entity = any> {
  public id: string
  public caption?: string
  icon?: FF_Icon
  public where?: FindOptionsBase<Entity>['where']
  public class?: string

  constructor(_id: string | number, options?: BaseEnumOptions<Entity>) {
    this.id = _id.toString()
    this.caption = options?.caption ?? this.id
    this.icon = options?.icon
    this.where = options?.where
    this.class = options?.class

    if (options?.icon && options.icon.caption === undefined) {
      options.icon.caption = options?.caption
    }
  }
}
