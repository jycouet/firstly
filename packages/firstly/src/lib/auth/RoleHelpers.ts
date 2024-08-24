import { repo } from 'remult'
import type { ClassType } from 'remult'
import { cyan, green, Log, yellow } from '@kitql/helpers'

import { FFAuthUser } from './Entities'

/**
 * will merge the roles and remove duplicates
 * will return a new array & a status if the array was changed
 */
export const mergeRoles = (existing: string[], newOnes: string[] | undefined) => {
  const result = new Set(existing)
  let changed = false
  for (const role of newOnes ?? []) {
    if (!result.has(role)) {
      result.add(role)
      changed = true
    }
  }
  return { roles: Array.from(result), changed }
}

export const initRoleFromEnv = async (
  log: Log,
  userEntity: ClassType<FFAuthUser>,
  envValue: string | undefined,
  role: string,
) => {
  const identifiers = envValue === undefined ? [] : (envValue ?? '').split(',').map((c) => c.trim())
  for (let i = 0; i < identifiers.length; i++) {
    const identifier = identifiers[i].trim()
    if (identifier !== '') {
      let user = await repo(userEntity).findFirst({ identifier })
      if (!user) {
        user = repo(userEntity).create({ identifier, roles: [role] })
        await repo(userEntity).save(user)
      } else {
        if (!user.roles.includes(role)) {
          user.roles.push(role)
          await repo(userEntity).save(user)
        }
      }
    }
  }
  if (identifiers.length > 0) {
    log.info(
      `${cyan(role)}: ${identifiers.map((c: any) => green(c.trim())).join(', ')} added via ${yellow(`.env`)}.`,
    )
  } else {
    log.info(`${cyan(role)}: No users added via ${yellow(`.env`)}.`)
  }
}
