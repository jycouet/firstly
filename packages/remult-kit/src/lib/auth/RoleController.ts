import { BackendMethod, repo } from 'remult'
import type { ClassType } from 'remult'
import { cyan, green, Log, yellow } from '@kitql/helpers'

import { KitAuthUser } from './Entities'

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

export class RoleController {
	@BackendMethod({ allowed: false })
	static initRoleFromEnv = async (
		log: Log,
		userEntity: ClassType<KitAuthUser>,
		envKey: string,
		role: string,
	) => {
		const { env } = await import('$env/dynamic/private')
		const names = env[envKey] === undefined ? [] : (env[envKey] ?? '').split(',')
		for (let i = 0; i < names.length; i++) {
			const name = names[i].trim()
			if (name !== '') {
				let user = await repo(userEntity).findFirst({ name })
				if (!user) {
					user = repo(userEntity).create({ name, roles: [role] })
					await repo(userEntity).save(user)
				} else {
					if (!user.roles.includes(role)) {
						user.roles.push(role)
						await repo(userEntity).save(user)
					}
				}
			}
		}
		if (names.length > 0) {
			log.info(
				`${cyan(role)}: ${names.map((c) => green(c.trim())).join(', ')} added via ${yellow(envKey)}.`,
			)
		} else {
			log.info(`${cyan(role)}: No users added via ${yellow(envKey)}.`)
		}
	}
}
