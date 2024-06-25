import { Entity, type EntityOptions } from 'remult'

import type { KitBaseEnum } from './KitBaseEnum'

export function KitEntity<entityType>(
  key: string,
  options: EntityOptions<
    entityType extends new (...args: any) => any ? InstanceType<entityType> : entityType
  >,
) {
  const toAllow = (permission: KitBaseEnum[] | KitBaseEnum | undefined) => {
    if (permission) {
      if (Array.isArray(permission)) {
        return permission.map((p) => p.id)
      }
      return permission.id
    }
    return undefined
  }

  return Entity(key, {
    ...options,
    allowApiCrud: options.allowApiCrud ?? toAllow(options.permissionApiCrud),
    allowApiDelete: options.allowApiDelete ?? toAllow(options.permissionApiDelete),
    allowApiInsert: options.allowApiInsert ?? toAllow(options.permissionApiInsert),
    allowApiRead: options.allowApiRead ?? toAllow(options.permissionApiRead),
    allowApiUpdate: options.allowApiUpdate ?? toAllow(options.permissionApiUpdate),

    // saved: async (item, e) => {
    //   console.log('was saved')
    //   await options?.saved?.(item, e)
    // },
  })
}
