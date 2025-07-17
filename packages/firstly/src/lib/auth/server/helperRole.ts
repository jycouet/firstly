import { repo, type ClassType } from 'remult'
import { nameify } from 'firstly/formats'
import { cyan, green, yellow } from '@kitql/helpers'
import type { Log } from '@kitql/helpers'

import { FFAuthProvider, type FFAuthAccount, type FFAuthUser } from '../Entities'

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

export const linkRoleToUsersFromEnv = async (o: {
	log: Log
	accountEntity: ClassType<FFAuthAccount>
	userEntity: ClassType<FFAuthUser>
	envKey: string
	envValue: string
	roles: string[]
}) => {
	const { log, accountEntity, userEntity, envKey, envValue, roles } = o
	const providersInfo =
		envValue === undefined
			? []
			: (envValue ?? '')
					.split(',')
					.map((c) => c.trim())
					.filter(Boolean)

	for (let i = 0; i < providersInfo.length; i++) {
		const [providerUserId, provider] = providersInfo[i].split('|')
		let a = await repo(accountEntity).findFirst({ providerUserId })
		if (!a) {
			const user = await repo(userEntity).upsert({ where: { roles, name: nameify(providerUserId) } })
			a = await repo(accountEntity).insert({
				providerUserId,
				provider: provider ?? FFAuthProvider.PASSWORD.id,
				userId: user.id,
			})
		} else {
			let user = await repo(userEntity).findFirst({ id: a.userId })
			if (!user) {
				user = repo(userEntity).create({ id: a.userId, name: nameify(providerUserId) })
			}
			const newRoles = [...new Set([...user.roles, ...roles].sort())]
			if ((newRoles ?? []).join(',') !== (user.roles ?? []).join(',')) {
				user.roles = newRoles
				await repo(userEntity).save(user)
			}
		}
	}
	if (providersInfo.length > 0) {
		log.info(
			`${cyan(envKey)}: ${providersInfo.map((c: any) => green(c.trim())).join(', ')} added via ${yellow(`.env`)}.`,
		)
	} else {
		log.info(`${cyan(envKey)}: No users added via ${yellow(`.env`)}.`)
	}
}
