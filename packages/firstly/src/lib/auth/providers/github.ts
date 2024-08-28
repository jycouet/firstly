import { GitHub } from 'arctic'

import { remult } from 'remult'

import { env } from '$env/dynamic/private'

import { checkOAuthConfig } from '.'
import { type FFOAuth2Provider } from '../'
import { logAuth } from '../client'

//------------------------------
// For developers (future me ?), To do another OAuth2 provider:
// Replace GITHUB / Github / github
// update "https://github.com/settings/developers" to the correct URL (2 places)
// update "https://api.github.com/user" the fetch user info
//------------------------------

/**
 * ## GitHub OAuth2 provider
 *
 * 1. Get your **id** & **secret** from [GitHub (direct link)](https://github.com/settings/developers).
 * 2. In GitHub, set your callback url to
 * - [ ] dev: `http://localhost:5173/api/auth_callback`
 * - [ ] prod: `https://MY_SUPER_SITE/api/auth_callback`
 * 3. In your project add a `.env` file with the following:
 * ```bash
 * GITHUB_CLIENT_ID = 'your-client-id'
 * GITHUB_CLIENT_SECRET = 'your-client-secret'
 * # GITHUB_REDIRECT_URI = '' # optional, will default to "${origin}/api/auth_callback"
 * ```
 * 4. In your frontend, under a button click call something like:
 * ```ts
 * async function oauth() {
 *   window.location.href = await Auth.signInOAuthGetUrl({ provider: 'github', redirect: window.location.pathname })
 * }
 * ```
 * 5. Enjoy 🥳
 */
export function github(options?: {
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  GITHUB_REDIRECT_URI?: string
  authorizationURLOptions?: ReturnType<
    FFOAuth2Provider<'github', GitHub>['authorizationURLOptions']
  >
  log?: boolean
}): FFOAuth2Provider<'github', GitHub> {
  const name = 'github'

  const clientID = options?.GITHUB_CLIENT_ID ?? env.GITHUB_CLIENT_ID ?? ''
  const secret = options?.GITHUB_CLIENT_SECRET ?? env.GITHUB_CLIENT_SECRET ?? ''

  const urlForKeys = 'https://github.com/settings/developers'
  checkOAuthConfig(name, clientID, secret, urlForKeys, false)

  return {
    name,
    isPKCE: false,
    getArcticProvider: () => {
      const redirectURI =
        options?.GITHUB_REDIRECT_URI ??
        env.GITHUB_REDIRECT_URI ??
        `${remult.context.url.origin}/api/auth_callback`

      checkOAuthConfig(name, clientID, secret, urlForKeys, true)

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
