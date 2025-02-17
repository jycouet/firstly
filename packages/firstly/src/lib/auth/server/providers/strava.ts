import { Strava } from 'arctic'

import { remult } from 'remult'

import { env } from '$env/dynamic/private'

import { authModuleRaw, type FFOAuth2Provider } from '../module'
import { checkOAuthConfig } from './helperProvider'

/**
 * ## Strava OAuth2 provider
 *
 * 1. Get your **id** & **secret** from [Strava (direct link)](https://www.strava.com/settings/api).
 * 2. In Strava, set your callback url to
 * - [ ] dev: `http://localhost:5173/api/auth_callback`
 * - [ ] prod: `https://MY_SUPER_SITE/api/auth_callback`
 * 3. In your project add a `.env` file with the following:
 * ```bash
 * STRAVA_CLIENT_ID = 'your-client-id'
 * STRAVA_CLIENT_SECRET = 'your-client-secret'
 * # STRAVA_REDIRECT_URI = '' # optional, will default to "${origin}/api/auth_callback"
 * ```
 * 4. In your frontend, under a button click call something like:
 * ```ts
 * async function oauth() {
 *   window.location.href = await Auth.signInOAuthGetUrl({ provider: 'strava', redirect: window.location.pathname })
 * }
 * ```
 * 5. Enjoy 🥳
 */
export function strava(options?: {
  STRAVA_CLIENT_ID?: string
  STRAVA_CLIENT_SECRET?: string
  STRAVA_REDIRECT_URI?: string
  authorizationURLOptions?: ReturnType<
    FFOAuth2Provider<'strava', Strava>['authorizationURLOptions']
  >
  log?: boolean
}): FFOAuth2Provider<'strava', Strava> {
  const name = 'strava'

  const clientID = options?.STRAVA_CLIENT_ID ?? env.STRAVA_CLIENT_ID ?? ''
  const secret = options?.STRAVA_CLIENT_SECRET ?? env.STRAVA_CLIENT_SECRET ?? ''

  const urlForKeys = 'https://www.strava.com/settings/api'
  checkOAuthConfig(name, clientID, secret, urlForKeys, false)

  return {
    name,
    isPKCE: false,
    getArcticProvider: () => {
      const redirectURI =
        options?.STRAVA_REDIRECT_URI ??
        env.STRAVA_REDIRECT_URI ??
        `${remult.context.request.url.origin}/api/auth_callback`
      checkOAuthConfig(name, clientID, secret, urlForKeys, true)
      return new Strava(clientID, secret, redirectURI)
    },
    authorizationURLOptions: () => {
      return options?.authorizationURLOptions ?? { scopes: [] }
    },
    getUserInfo: async (tokens) => {
      const res = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })
      const user = await res.json()
      if (options?.log) {
        authModuleRaw.log.info(`user`, user)
      }
      return { raw: user, providerUserId: String(user.id), nameOptions: [user.login] }
    },
  }
}
