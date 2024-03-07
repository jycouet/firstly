import { GitHub } from 'arctic'

import { remult } from 'remult'

import { env } from '$env/dynamic/private'

import { checkOAuthConfig } from '.'
import { logAuth, type KitOAuth2Provider } from '../'

/**
 * GitHub OAuth2 provider
 *
 * In GitHub, set your callback url to
 * - dev: `http://localhost:5173/api/auth_callback`
 * - prod: `https://MY_SUPER_SITE/api/auth_callback`
 *
 * In your project add a `.env` file with the following:
 *
 * ```env
 * GITHUB_CLIENT_ID= 'your-client-id'
 * GITHUB_CLIENT_SECRET= 'your-client-secret'
 * ```
 *
 * _FYI: GITHUB_REDIRECT_URI is optional as auth module will default to "${origin}/api/auth_callback"._
 */
export function github(options?: {
	clientID?: string
	secret?: string
	redirectURI?: string
	authorizationURLOptions?: ReturnType<
		KitOAuth2Provider<'github', GitHub>['authorizationURLOptions']
	>
	log?: boolean
}): KitOAuth2Provider<'github', GitHub> {
	const name = 'github'

	const clientID = options?.clientID ?? env.GITHUB_CLIENT_ID ?? ''
	const secret = options?.secret ?? env.GITHUB_CLIENT_SECRET ?? ''
	checkOAuthConfig(name, clientID, secret, false)

	return {
		name,
		isPKCE: false,
		getArcticProvider: () => {
			const redirectURI = options?.redirectURI || `${remult.context.url.origin}/api/auth_callback`

			checkOAuthConfig(name, clientID, secret, true)

			return new GitHub(clientID, secret, { redirectURI })
		},
		authorizationURLOptions: () => {
			return options?.authorizationURLOptions ?? { scopes: [] }
		},
		getUserInfo: async (tokens) => {
			const res = await fetch('https://api.github.com/user', {
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
				},
			})
			const user = await res.json()
			if (options?.log) {
				logAuth.info(`user`, user)
			}
			return { raw: user, providerUserId: String(user.id), nameOptions: [user.login] }
		},
	}
}
