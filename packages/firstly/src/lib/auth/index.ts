import { redirect } from '@sveltejs/kit'
import type {
  OAuth2Provider as ArcticOAuth2Provider,
  OAuth2ProviderWithPKCE as ArcticOAuth2ProviderWithPKCE,
} from 'arctic'
import { DEV } from 'esm-env'
import { Lucia, TimeSpan, type SessionCookieOptions } from 'lucia'

import { remult } from 'remult'
import type { ClassType, UserInfo } from 'remult'
import { red } from '@kitql/helpers'
import { getRelativePackagePath, read } from '@kitql/internals'

import { FF_Role } from '../'
import type { Module } from '../api'
import type { RecursivePartial, ResolvedType } from '../utils/types'
import { RemultLuciaAdapter } from './Adapter'
import { AuthControllerServer } from './AuthController.server'
import { Auth, logAuth } from './client'
import {
  FF_Role_Auth,
  FFAuthAccount,
  FFAuthProvider,
  FFAuthUser,
  FFAuthUserSession,
} from './client/Entities'
import { createOrExtendSession } from './helper'
import { initRoleFromEnv } from './RoleHelpers'
import type { firstlyData, firstlyDataAuth } from './types'

export type { firstlyData }

// It's sure that we can do better than that! ;)
export type AuthorizationURLOptions = Record<
  string,
  {
    scopes?: string[]
  }
>

export type DynamicAuthorizationURLOptions<T extends FFOAuth2Provider[] = FFOAuth2Provider[]> =
  T extends Array<infer O>
    ? O extends FFOAuth2Provider
      ? {
          [P in O['name']]: ReturnType<O['authorizationURLOptions']>
        }
      : never
    : never

type OAuth2UserInfo = {
  raw?: any
  providerUserId: string
  /** Will take the first option available */
  nameOptions: string[]
}
export type FFOAuth2Provider<
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
  TUserEntity extends FFAuthUser = FFAuthUser,
  TSessionEntity extends FFAuthUserSession = FFAuthUserSession,
  TAccountEntity extends FFAuthAccount = FFAuthAccount,
> = {
  customEntities?: {
    User?: ClassType<TUserEntity>
    Session?: ClassType<TSessionEntity>
    Account?: ClassType<TAccountEntity>
  }

  debug?: boolean
  ui?: false | RecursivePartial<firstlyDataAuth['ui']>

  /** Usefull to overwrite where the static files are */
  uiStaticPath?: string

  /** in secondes @default 30 days */
  sessionExpiresIn?: number
  sessionCookie?: SessionCookieOptions

  defaultRedirect?: string

  /**
   * Can a user sign up by itself? Or we can join only by invitation ?
   * If false, no one can sign up alone.
   * @default true
   **/
  signUp?: boolean

  /**
   * To be able to sign in user needs to be verified or not?
   * ```
   *  `Auto` =>  noting will be checked
   *  `Email` => users needs to click a link in an email
   *  `Manual` => an admin needs to verify the user and set verifiedAt in the database
   * ```
   * @default auto
   **/
  verifiedMethod?: 'auto' | 'email' | 'manual'

  invitationSend?: (args: { email: string; url: string }) => Promise<void>

  transformDbUserToClientUser?: (session: any, user: TUserEntity) => DatabaseUserAttributes

  providers?: {
    demo?: {
      name: string
      roles?: string[]
    }[]

    password?: {
      /**
       * Reseting the password
       */
      resetPasswordSend?: (args: { email: string; url: string }) => Promise<void>
      /** in secondes @default 5 minutes */
      resetPasswordExpiresIn?: number

      /**
       * Verify the Mail
       */
      verifyMailSend?: (args: { email: string; url: string }) => Promise<void>
      /** in secondes @default 5 minutes */
      verifyMailExpiresIn?: number

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

    oAuths?: FFOAuth2Provider[]
  }
}

export let AUTH_OPTIONS: AuthOptions = { ui: {} }

const buildUrlOrDefault = (
  base: string,
  userSetting: string | false | undefined,
  fallback: string,
) => {
  if (userSetting === false) {
    return false
  }
  if (userSetting === undefined) {
    return `${base}/${fallback}`
  }
  return `${base}/${userSetting}`
}

export const getSafeOptions = () => {
  const signUp = AUTH_OPTIONS.signUp ?? true
  const base =
    AUTH_OPTIONS.ui === false ? 'NO_BASE_PATH' : (AUTH_OPTIONS.ui?.paths?.base ?? '/ff/auth')

  const firstlyData: firstlyData = {
    module: 'auth',
    debug: AUTH_OPTIONS.debug,
    props: {
      ui:
        AUTH_OPTIONS.ui === false
          ? undefined
          : {
              paths: {
                base,
                sign_up: buildUrlOrDefault(base, AUTH_OPTIONS.ui?.paths?.sign_up, 'sign-up'),
                sign_in: buildUrlOrDefault(base, AUTH_OPTIONS.ui?.paths?.sign_in, 'sign-in'),
                forgot_password: buildUrlOrDefault(
                  base,
                  AUTH_OPTIONS.ui?.paths?.forgot_password,
                  'forgot-password',
                ),
                reset_password: buildUrlOrDefault(
                  base,
                  AUTH_OPTIONS.ui?.paths?.reset_password,
                  'reset-password',
                ),
                verify_email: buildUrlOrDefault(
                  base,
                  AUTH_OPTIONS.ui?.paths?.verify_email,
                  'verify-email',
                ),
              },
              strings: {
                email: AUTH_OPTIONS.ui?.strings?.email ?? 'Email',
                email_placeholder:
                  AUTH_OPTIONS.ui?.strings?.email_placeholder ?? 'Your email address',
                password: AUTH_OPTIONS.ui?.strings?.password ?? 'Password',
                confirm: AUTH_OPTIONS.ui?.strings?.confirm ?? 'Confirm',
                reset: AUTH_OPTIONS.ui?.strings?.reset ?? 'Reset',
                btn_sign_up: AUTH_OPTIONS.ui?.strings?.btn_sign_up ?? 'Sign up',
                btn_sign_in: AUTH_OPTIONS.ui?.strings?.btn_sign_in ?? 'Sign in',
                forgot_password:
                  AUTH_OPTIONS.ui?.strings?.forgot_password ?? 'Forgot your password?',
                send_password_reset_instructions:
                  AUTH_OPTIONS.ui?.strings?.send_password_reset_instructions ??
                  'Send password reset instructions',
                back_to_sign_in: AUTH_OPTIONS.ui?.strings?.back_to_sign_in ?? 'Back to sign in',
              },
            },
    },
  }

  let uiStaticPath = AUTH_OPTIONS.uiStaticPath ?? ''
  if (!AUTH_OPTIONS.uiStaticPath) {
    const installedFirstlyPath = getRelativePackagePath('firstly')
    if (installedFirstlyPath) {
      uiStaticPath = `${installedFirstlyPath}/esm/auth/static/`
    }
  }

  let redirectUrl = AUTH_OPTIONS.defaultRedirect ?? '/'
  if (!redirectUrl.startsWith('/')) {
    logAuth.error(
      `Invalid redirect url ${red(redirectUrl)} (it should be a local one starting with /)`,
    )
    redirectUrl = '/'
  }

  let transformDbUserToClientUserToUse: (session: any, user: FFAuthUser) => DatabaseUserAttributes
  if (AUTH_OPTIONS.transformDbUserToClientUser) {
    transformDbUserToClientUserToUse = AUTH_OPTIONS.transformDbUserToClientUser
  } else {
    // Need in src/app.d.ts this code to be able to have the correct transformDbUserToClientUser returned type.
    // In the lib, let's force to this default
    /**
     * declare module 'remult' {
     *   export interface UserInfo {
     *     specificThing: string
     *   }
     * }
     */
    // @ts-ignore
    transformDbUserToClientUserToUse = (session: any, user: FFAuthUser) => {
      return {
        id: user.id,
        name: user.identifier,
        roles: user.roles,
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      }
    }
  }

  return {
    User: AUTH_OPTIONS.customEntities?.User ?? FFAuthUser,
    Session: AUTH_OPTIONS.customEntities?.Session ?? FFAuthUserSession,
    Account: AUTH_OPTIONS.customEntities?.Account ?? FFAuthAccount,

    signUp,
    password_enabled: AUTH_OPTIONS.providers?.password ? true : false,
    otp_enabled: AUTH_OPTIONS.providers?.otp ? true : false,

    verifiedMethod: AUTH_OPTIONS.verifiedMethod ?? 'auto',
    redirectUrl,

    firstlyData,
    transformDbUserToClientUser: transformDbUserToClientUserToUse,
    uiStaticPath,
  }
}

/**
 * To enable authentication in your app in a few lines of code.
 * _Info: index: -777_
 */
export const auth: (o: AuthOptions) => Module = (o) => {
  AUTH_OPTIONS = o
  const oSafe = getSafeOptions()

  // abstract the call
  Auth.signOutFn = AuthControllerServer.signOut
  Auth.signInDemoFn = AuthControllerServer.signInDemo
  Auth.inviteFn = AuthControllerServer.invite
  Auth.signUpPasswordFn = AuthControllerServer.signUpPassword
  Auth.signInPasswordFn = AuthControllerServer.signInPassword
  Auth.forgotPasswordFn = AuthControllerServer.forgotPassword
  Auth.resetPasswordFn = AuthControllerServer.resetPassword
  Auth.signInOTPFn = AuthControllerServer.signInOTP
  Auth.verifyOtpFn = AuthControllerServer.verifyOtp
  Auth.signInOAuthGetUrlFn = AuthControllerServer.signInOAuthGetUrl

  const adapter = new RemultLuciaAdapter()

  const defaultExpiresIn = 60 * 60 * 24 * 30 // 30 days
  const sessionExpiresIn = new TimeSpan(AUTH_OPTIONS.sessionExpiresIn ?? defaultExpiresIn, 's')
  lucia = new Lucia<Record<any, any>, UserInfo>(adapter, {
    sessionExpiresIn,
    sessionCookie: {
      name: AUTH_OPTIONS.sessionCookie?.name ?? 'firstly_auth_session',
      expires: AUTH_OPTIONS.sessionCookie?.expires,
      attributes: {
        // set to `true` when using HTTPS
        secure: !DEV,
        ...AUTH_OPTIONS.sessionCookie?.attributes,
      },
    },
    getSessionAttributes: (attributes) => attributes,
    getUserAttributes: (attributes) => attributes,
  })

  return {
    name: 'auth',
    index: -777,
    entities: [oSafe.User, oSafe.Session, oSafe.Account],
    controllers: [Auth],
    initRequest: async (event) => {
      // REMULT: storing user in local should probably be done in remult directly
      if (event?.locals?.user) {
        // console.log('initRequest OK')
        remult.user = event.locals.user
      } else {
        // console.log('initRequest WORK...')
        // std session
        const sessionId = event.cookies.get(lucia.sessionCookieName)

        if (sessionId) {
          const { session, user } = await lucia.validateSession(sessionId)
          if (session && session.fresh) {
            await createOrExtendSession(session.id, session)
          }
          remult.user = user ?? undefined
          if (event.locals) {
            event.locals.user = user ?? undefined
          }
        }
      }
    },
    earlyReturn: async ({ event, resolve }) => {
      const oSafe = getSafeOptions()

      if (event.url.pathname === oSafe.firstlyData.props.ui?.paths?.verify_email) {
        const token = event.url.searchParams.get('token') ?? ''

        if (!oSafe.password_enabled) {
          throw Error('Password is not enabled!')
        }

        const account = await remult
          .repo(oSafe.Account)
          .findFirst({ token, provider: FFAuthProvider.PASSWORD.id })

        if (!account) {
          throw new Error('Invalid token')
        }
        if (account.expiresAt && account.expiresAt < new Date()) {
          throw new Error('token expired')
        }

        await lucia.invalidateUserSessions(account.userId)

        // update elements
        account.token = undefined
        account.expiresAt = undefined
        account.lastVerifiedAt = new Date()

        await remult.repo(oSafe.Account).save(account)

        await createOrExtendSession(account.userId)

        redirect(302, oSafe.redirectUrl)
      }

      if (
        oSafe.firstlyData.props.ui?.paths?.base &&
        event.url.pathname.startsWith(oSafe.firstlyData.props.ui.paths.base)
      ) {
        const content = read(`${oSafe.uiStaticPath}index.html`)

        return {
          early: true,
          resolve: new Response(
            content + `<script>const firstlyData = ${JSON.stringify(oSafe.firstlyData)}</script>`,
            {
              headers: { 'content-type': 'text/html' },
            },
          ),
        }
      }

      if (event.url.pathname.startsWith('/api/static')) {
        const content = read(
          `${oSafe.uiStaticPath}${event.url.pathname.replaceAll('/api/static/', '')}`,
        )
        if (content) {
          const seg = event.url.pathname.split('.')
          const map: Record<string, string> = {
            js: 'text/javascript',
            css: 'text/css',
            svg: 'image/svg+xml',
          }

          return {
            early: true,
            resolve: new Response(content, {
              headers: { 'content-type': map[seg[seg.length - 1]] ?? 'text/plain' },
            }),
          }
        }
      }

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
        const redirectUrl = redirectUrlCookie ?? oSafe.redirectUrl

        if (!code || !state || !storedState || state !== storedState || !keyState) {
          redirect(302, redirectUrl)
        }

        const selectedOAuth = AUTH_OPTIONS.providers?.oAuths?.find((c) => c.name === keyState)
        if (selectedOAuth && code) {
          const tokens = await selectedOAuth.getArcticProvider().validateAuthorizationCode(code)
          let info: OAuth2UserInfo
          try {
            info = await selectedOAuth.getUserInfo(tokens)
          } catch (error) {
            redirect(302, redirectUrl)
          }

          if (!info.providerUserId) {
            redirect(302, redirectUrl)
          }

          let account = await remult
            .repo(oSafe.Account)
            .findFirst({ provider: keyState, providerUserId: info.providerUserId })
          if (!account) {
            if (!oSafe.signUp) {
              // throw Error("You can't signup by yourself! Contact the administrator.")
              redirect(302, redirectUrl)
            }

            // for each info.name, we check if it exists take the first option
            // and add the providerUserId to the name if no option available

            let nameToUse = ''
            for (let i = 0; i < info.nameOptions.length; i++) {
              const existingUser = await remult
                .repo(oSafe.User)
                .findOne({ where: { identifier: info.nameOptions[i] } })
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
            user.identifier = nameToUse

            account = remult.repo(oSafe.Account).create()
            account.provider = keyState
            account.providerUserId = info.providerUserId
            account.token = tokens.accessToken
            account.userId = user.id
            account.lastVerifiedAt = new Date()

            await remult.repo(oSafe.User).save(user)
            await remult.repo(oSafe.Account).save(account)
          } else {
            account.token = tokens.accessToken
            await remult.repo(oSafe.Account).save(account)
          }

          await createOrExtendSession(account.userId)

          event.cookies.delete(`${keyState}_oauth_state`, { path: '/' })
          event.cookies.delete(`code_verifier`, { path: '/' })
        }

        redirect(302, redirectUrl)
      }
      return { early: false }
    },
    initApi: async () => {
      await initRoleFromEnv(logAuth, oSafe.User, 'FF_ROLE_ADMIN', FF_Role.Admin)
      await initRoleFromEnv(logAuth, oSafe.User, 'FF_ROLE_AUTH_ADMIN', FF_Role_Auth.Admin)
    },
  }
}

export { initRoleFromEnv }

// Maybe moving this to /auth/server.ts would be better, people will be able to import from firstly all the time

export let lucia: Lucia<Record<any, any>, UserInfo>

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseSessionAttributes: DatabaseSessionAttributes
    DatabaseUserAttributes: DatabaseUserAttributes
  }
  interface DatabaseSessionAttributes {}
}
interface DatabaseUserAttributes extends UserInfo {
  // id: string
  // name: string
  // roles: string[]
  session: {
    id: string
    expiresAt: Date
  }
}
