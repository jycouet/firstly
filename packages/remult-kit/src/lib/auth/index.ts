import { redirect } from '@sveltejs/kit'
import type {
  OAuth2Provider as ArcticOAuth2Provider,
  OAuth2ProviderWithPKCE as ArcticOAuth2ProviderWithPKCE,
} from 'arctic'
import { DEV } from 'esm-env'
import { Lucia, TimeSpan, type SessionCookieOptions } from 'lucia'

import { remult } from 'remult'
import type { ClassType, UserInfo } from 'remult'
import { Log, red } from '@kitql/helpers'

import type { ResolvedType } from '$lib/utils/types'

import { KitRole } from '../'
import type { Module } from '../api'
import { RemultLuciaAdapter } from './Adapter'
import { AuthController } from './AuthController'
import { KitAuthAccount, KitAuthRole, KitAuthUser, KitAuthUserSession } from './Entities'
import { createSession } from './helper'
import { RoleController } from './RoleController'

export { KitAuthUser, KitAuthAccount, AuthProvider, KitAuthUserSession } from './Entities'
export { AuthController } from './AuthController'

// I's sure that we can do better than that! ;)
export type AuthorizationURLOptions = Record<
  string,
  {
    scopes?: string[]
  }
>

export type DynamicAuthorizationURLOptions<T extends KitOAuth2Provider[] = KitOAuth2Provider[]> =
  T extends Array<infer O>
    ? O extends KitOAuth2Provider
      ? {
          [P in O['name']]: ReturnType<O['authorizationURLOptions']>
        }
      : never
    : never

export const logAuth = new Log('remult-kit | Auth')

export { KitAuthRole } from './Entities'

type OAuth2UserInfo = {
  raw?: any
  providerUserId: string
  /** Will take the first option available */
  nameOptions: string[]
}
export type KitOAuth2Provider<
  LitName extends string = string,
  T extends ArcticOAuth2Provider | ArcticOAuth2ProviderWithPKCE = ArcticOAuth2Provider,
> = {
  name: LitName
  getArcticProvider: () => T
  // TODO: Today you have to set it explicitly... Would be good to have false or undefined working
  isPKCE: T extends ArcticOAuth2Provider
    ? false
    : T extends ArcticOAuth2ProviderWithPKCE
      ? true
      : never
  authorizationURLOptions: () => T extends ArcticOAuth2Provider
    ? Parameters<T['createAuthorizationURL']>[1]
    : T extends ArcticOAuth2ProviderWithPKCE
      ? Parameters<T['createAuthorizationURL']>[2]
      : never
  getUserInfo(
    tokens: ResolvedType<ReturnType<T['validateAuthorizationCode']>>,
  ): Promise<OAuth2UserInfo>
}

type AuthOptions<
  TUserEntity extends KitAuthUser = KitAuthUser,
  TSessionEntity extends KitAuthUserSession = KitAuthUserSession,
  TAccountEntity extends KitAuthAccount = KitAuthAccount,
> = {
  customEntities?: {
    User?: ClassType<TUserEntity>
    Session?: ClassType<TSessionEntity>
    Account?: ClassType<TAccountEntity>
  }

  /** in secondes @default 15 days */
  sessionExpiresIn?: number
  sessionCookie?: SessionCookieOptions

  defaultRedirect?: string

  providers?: {
    demo?: {
      name: string
      roles?: string[]
    }[]

    password?: {
      /**
       * Can a user sign up by itself? Or we can join only by invitation ?
       * If false, no one can sign up alone.
       * @default true
       **/
      selfSignUp?: boolean

      /**
       * Usually, we send an email to the user to verify his email address.
       */
      resetPassword?: (url: string) => Promise<void>
      /** in secondes @default 5 minutes */
      resetPasswordExpiresIn?: number

      /**
       * Some settings for the password hashing algorithm _(using argon2 under the hood)_
       */
      argon2Settings?: {
        memorySize?: number | undefined
        iterations?: number | undefined
        tagLength?: number | undefined
        parallelism?: number | undefined
        secret?: ArrayBuffer | undefined
        // secret?: ArrayBuffer | TypedArray | undefined;
      }
    }

    otp?: {
      issuer?: string
      /** in secondes @default 30 seconds */
      expiresIn?: number
      /** Number of digits @default 6 */
      digits?: number
      send?: (data: { name: string; otp: string; uri: string }) => Promise<void>
    }

    oAuths?: KitOAuth2Provider[]
  }
}

export let AUTH_OPTIONS: AuthOptions = {}

export const getSafeOptions = () => {
  return {
    User: AUTH_OPTIONS.customEntities?.User ?? KitAuthUser,
    Session: AUTH_OPTIONS.customEntities?.Session ?? KitAuthUserSession,
    Account: AUTH_OPTIONS.customEntities?.Account ?? KitAuthAccount,
  }
}

/**
 * To enable authentication in your app in a few lines of code.
 * _Info: index: -777_
 */
export const auth: (o: AuthOptions) => Module = (o) => {
  AUTH_OPTIONS = o
  const oSafe = getSafeOptions()
  return {
    name: 'auth',
    index: -777,
    entities: [oSafe.User, oSafe.Session, oSafe.Account],
    controllers: [AuthController],
    initRequest: async (event) => {
      // std session
      const sessionId = event.cookies.get(lucia.sessionCookieName)

      if (sessionId) {
        const { session, user } = await lucia.validateSession(sessionId)
        if (session && session.fresh) {
          const sessionCookie = lucia.createSessionCookie(session.id)
          event.cookies.set(sessionCookie.name, sessionCookie.value, {
            path: '/',
            ...sessionCookie.attributes,
          })
        }
        remult.user = user ?? undefined
      }
    },
    earlyReturn: async ({ event, resolve }) => {
      if (event.url.pathname === '/api/auth_callback') {
        const code = event.url.searchParams.get('code')
        const state = event.url.searchParams.get('state')

        const keys = AUTH_OPTIONS.providers?.oAuths?.map((c) => c.name) ?? []

        let storedState = null
        let keyState: string | null = null
        for (const key of keys) {
          storedState = event.cookies.get(`${key}_oauth_state`) ?? null
          if (storedState) {
            keyState = key
            break
          }
        }

        const redirectUrlCookie = event.cookies.get(`remult_redirect`)
        if (redirectUrlCookie) {
          event.cookies.delete(`remult_redirect`, { path: '/' })
        }
        let redirectUrl = redirectUrlCookie ?? AUTH_OPTIONS.defaultRedirect ?? '/'
        if (!redirectUrl.startsWith('/')) {
          logAuth.error(
            `Invalid redirect url ${red(redirectUrl)} (it should be a local one starting with /)`,
          )
          redirectUrl = '/'
        }

        if (!code || !state || !storedState || state !== storedState || !keyState) {
          redirect(302, redirectUrl)
        }

        const selectedOAuth = AUTH_OPTIONS.providers?.oAuths?.find((c) => c.name === keyState)
        if (selectedOAuth && code) {
          const tokens = await selectedOAuth.getArcticProvider().validateAuthorizationCode(code)
          const info = await selectedOAuth.getUserInfo(tokens)

          if (!info.providerUserId) {
            redirect(302, redirectUrl)
          }

          let account = await remult
            .repo(oSafe.Account)
            .findFirst({ provider: keyState, providerUserId: info.providerUserId })
          if (!account) {
            // for each info.name, we check if it exists take the first option
            // and add the providerUserId to the name if no option available

            let nameToUse = ''
            for (let i = 0; i < info.nameOptions.length; i++) {
              const existingUser = await remult
                .repo(oSafe.User)
                .findOne({ where: { name: info.nameOptions[i] } })
              if (existingUser) {
                // Don't do anything
              } else {
                nameToUse = info.nameOptions[i]
                break
              }
            }
            if (nameToUse === '') {
              nameToUse = `${info.nameOptions[0]}-${info.providerUserId}`
            }

            const user = remult.repo(oSafe.User).create()
            user.name = nameToUse

            account = remult.repo(oSafe.Account).create()
            account.provider = keyState
            account.providerUserId = info.providerUserId
            account.token = tokens.accessToken
            account.userId = user.id

            await remult.repo(oSafe.User).save(user)
            await remult.repo(oSafe.Account).save(account)
          } else {
            account.token = tokens.accessToken
            await remult.repo(oSafe.Account).save(account)
          }

          await createSession(account.userId)

          event.cookies.delete(`${keyState}_oauth_state`, { path: '/' })
          event.cookies.delete(`code_verifier`, { path: '/' })
        }

        redirect(302, redirectUrl)
        // return resolve(event)
      }
      return { early: false }
    },
    initApi: async () => {
      await RoleController.initRoleFromEnv(logAuth, oSafe.User, 'KIT_ADMIN', KitRole.Admin)
      await RoleController.initRoleFromEnv(logAuth, oSafe.User, 'KIT_AUTH_ADMIN', KitAuthRole.Admin)
    },
  }
}

const adapter = new RemultLuciaAdapter()

const defaultExpiresIn = 60 * 60 * 24 * 15 // 15 days
export const lucia = new Lucia<Record<any, any>, UserInfo>(adapter, {
  sessionExpiresIn: new TimeSpan(AUTH_OPTIONS.sessionExpiresIn ?? defaultExpiresIn, 's'),
  sessionCookie: {
    name: AUTH_OPTIONS.sessionCookie?.name ?? 'remult_auth_session',
    expires: AUTH_OPTIONS.sessionCookie?.expires,
    attributes: {
      // set to `true` when using HTTPS
      secure: !DEV,
      ...AUTH_OPTIONS.sessionCookie?.attributes,
    },
  },
  getSessionAttributes: (attributes) => {
    return {
      ...attributes,
    }
  },
  getUserAttributes(attributes) {
    // @ts-expect-error
    delete attributes['createdAt']
    // @ts-expect-error
    delete attributes['updatedAt']

    // to remove relations
    for (const key in attributes) {
      if (attributes[key as keyof DatabaseUserAttributes] === undefined) {
        delete attributes[key as keyof DatabaseUserAttributes]
      }
    }

    return attributes
    // return {
    // 	...attributes,
    // }
  },
})

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseSessionAttributes: DatabaseSessionAttributes
    DatabaseUserAttributes: DatabaseUserAttributes
  }
  interface DatabaseSessionAttributes {}
}
interface DatabaseUserAttributes {
  id: string
  name: string
  roles: string[]
  session: {
    id: string
    expiresAt: Date
  }
}
