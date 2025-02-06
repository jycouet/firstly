import { redirect } from '@sveltejs/kit'
import type {
  OAuth2Provider as ArcticOAuth2Provider,
  OAuth2ProviderWithPKCE as ArcticOAuth2ProviderWithPKCE,
} from 'arctic'

import { remult } from 'remult'
import type { ClassType, UserInfo } from 'remult'
import { red } from '@kitql/helpers'
import { getRelativePackagePath, read } from '@kitql/internals'

import { AuthController, logAuth } from '..'
import { FF_Role } from '../..'
import type { Module } from '../../api'
import type { RecursivePartial, ResolvedType } from '../../utils/types'
import {
  FF_Role_Auth,
  FFAuthAccount,
  FFAuthProvider,
  FFAuthUser,
  FFAuthUserSession,
} from '../Entities'
import type { firstlyData, firstlyDataAuth } from '../types'
import { AuthControllerServer } from './AuthController.server'
import { validateSessionToken } from './helperDb'
import { setSessionTokenCookie } from './helperRemultServer'
import { initRoleFromEnv } from './helperRole'

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

export type OAuth2UserInfo = {
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

  session?: {
    /** in secondes @default 1000 * 60 * 60 * 24 * 30, // 30 days, */
    expiresInMs?: number
    cookieName?: string
  }

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

  transformDbUserToClientUser?: (session: any, user: TUserEntity) => UserInfo

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
                sign_up: signUp
                  ? buildUrlOrDefault(base, AUTH_OPTIONS.ui?.paths?.sign_up, 'sign-up')
                  : false,
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

  let transformDbUserToClientUserToUse: (session: FFAuthUserSession, user: FFAuthUser) => UserInfo
  if (AUTH_OPTIONS.transformDbUserToClientUser) {
    transformDbUserToClientUserToUse = AUTH_OPTIONS.transformDbUserToClientUser
  } else {
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

    session: {
      expiresInMs: AUTH_OPTIONS.session?.expiresInMs ?? 1000 * 60 * 60 * 24 * 30, // 30 days,
      cookieName: AUTH_OPTIONS.session?.cookieName ?? 'firstly_auth_session',
    },

    providers: AUTH_OPTIONS.providers,
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
  AuthController.signOutFn = AuthControllerServer.signOut
  AuthController.signInDemoFn = AuthControllerServer.signInDemo
  AuthController.inviteFn = AuthControllerServer.invite
  AuthController.signUpPasswordFn = AuthControllerServer.signUpPassword
  AuthController.signInPasswordFn = AuthControllerServer.signInPassword
  AuthController.forgotPasswordFn = AuthControllerServer.forgotPassword
  AuthController.resetPasswordFn = AuthControllerServer.resetPassword
  AuthController.signInOTPFn = AuthControllerServer.signInOTP
  AuthController.verifyOtpFn = AuthControllerServer.verifyOtp
  AuthController.signInOAuthGetUrlFn = AuthControllerServer.signInOAuthGetUrl

  return {
    name: 'auth',
    priority: -777,
    entities: [oSafe.User, oSafe.Session, oSafe.Account],
    controllers: [AuthController],
    initRequest: async (event) => {
      // REMULT: storing user in local should probably be done in remult directly
      if (event?.locals?.user) {
        remult.user = event.locals.user
      } else {
        const sessionId = event.cookies.get(oSafe.session.cookieName)
        if (sessionId) {
          const { user, freshSession } = await validateSessionToken(sessionId)
          if (freshSession) {
            setSessionTokenCookie(freshSession.sessionToken, freshSession.expiresAt)
          }
          remult.user = user
          if (event.locals) {
            event.locals.user = user
          }
        }
      }
    },
    initApi: async () => {
      await initRoleFromEnv(logAuth, oSafe.User, 'FF_ROLE_ADMIN', FF_Role.FF_Role_Admin)
      await initRoleFromEnv(
        logAuth,
        oSafe.User,
        'FF_ROLE_AUTH_ADMIN',
        FF_Role_Auth.FF_Role_Auth_Admin,
      )
    },
  }
}

export { initRoleFromEnv }

declare module 'remult' {
  export interface UserInfo {
    session: {
      id: string
      expiresAt: Date
    }
  }
}
