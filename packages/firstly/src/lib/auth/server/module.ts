import bcrypt from 'bcrypt'
import { EntityError, remult } from 'remult'
import type { ClassType, UserInfo } from 'remult'
import { red } from '@kitql/helpers'
import { getRelativePackagePath } from '@kitql/internals'

import { AuthController } from '..'
import { FF_Role } from '../..'
import { Module } from '../../api'
import type { RecursivePartial } from '../../utils/types'
import { FF_Role_Auth, FFAuthAccount, FFAuthUser, FFAuthUserSession } from '../Entities'
import type { firstlyData, firstlyDataAuth } from '../types'
import { AuthControllerServer } from './AuthController.server'
import { validateSessionToken } from './helperDb'
import { setSessionTokenCookie } from './helperRemultServer'
import { initRoleFromEnv } from './helperRole'
import type { OAuth2Tokens } from 'arctic'

export type { firstlyData }

export type ProviderConfigured = Record<string, ProviderAuthorizationURLOptions>
export type ProviderAuthorizationURLOptions = string[]
export type OAuth2UserInfo = {
  raw?: any
  providerUserId: string
  /** Will take the first option available */
  nameOptions: string[]
}

// TODO revalidate token?
export type FFOAuth2Provider<T = any, LitName extends string = string> = {
  name: LitName
  getArcticProvider: () => T
  authorizationURLOptions: () => ProviderAuthorizationURLOptions
  getUserInfo(tokens: OAuth2Tokens): Promise<OAuth2UserInfo>
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
    /** in milliseconds @default 30 days (1000 * 60 * 60 * 24 * 30) */
    expiresIn?: number
    COOKIE_NAME?: string
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

  transformDbUserToClientUser?: (session: TSessionEntity, user: TUserEntity) => UserInfo

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

      settings?: {
        bcrypt?: {
          /**
           * Validate the password or throw an error.
           *
           * Here is an example (and it's the default implementation):
           * ```
           * function validatePassword(password: string) {
           *   if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
           *     throw new EntityError({ message: 'Invalid password' })
           *   }
           * }
           * ```
           */
          validatePassword?: (password: string) => void

          /**
           * If you want to NOT use the default bcrypt, you can pass your own thing!
           */
          passwordHash?: (password: string) => string
          /**
           * The number of rounds to use for the bcrypt hash.
           * @default 10
           */
          saltRounds?: number

          /**
           * If you want to NOT use the default bcrypt, you can pass your own thing!
           */
          passwordVerify?: (password: string, hash: string) => boolean
        }
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

export const getSafeOptions = <
  TUserEntity extends FFAuthUser = FFAuthUser,
  TSessionEntity extends FFAuthUserSession = FFAuthUserSession,
  TAccountEntity extends FFAuthAccount = FFAuthAccount,
>() => {
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
              password_placeholder:
                AUTH_OPTIONS.ui?.strings?.password_placeholder ?? 'Your password',
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
    authModuleRaw.log.error(
      `Invalid redirect url ${red(redirectUrl)} (it should be a local one starting with /)`,
    )
    redirectUrl = '/'
  }

  let transformDbUserToClientUserToUse: (session: TSessionEntity, user: TUserEntity) => UserInfo

  if (AUTH_OPTIONS.transformDbUserToClientUser) {
    transformDbUserToClientUserToUse = AUTH_OPTIONS.transformDbUserToClientUser as (
      session: TSessionEntity,
      user: TUserEntity,
    ) => UserInfo
  } else {
    // @ts-ignore (I'm not sure why cadb-my-doc is failing check here if I don't do this!)
    transformDbUserToClientUserToUse = (session, user) => {
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

  function validatePassword(password: string) {
    if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
      throw new EntityError({ message: 'Invalid password' })
    }
  }

  function passwordHash(password: string) {
    validatePassword(password)
    return bcrypt.hashSync(
      password,
      AUTH_OPTIONS.providers?.password?.settings?.bcrypt?.saltRounds ?? 10,
    )
  }

  function passwordVerify(password: string, hash: string) {
    return bcrypt.compareSync(password, hash)
  }

  return {
    User: (AUTH_OPTIONS.customEntities?.User ?? FFAuthUser) as ClassType<TUserEntity>,
    Session: (AUTH_OPTIONS.customEntities?.Session ??
      FFAuthUserSession) as ClassType<TSessionEntity>,
    Account: (AUTH_OPTIONS.customEntities?.Account ?? FFAuthAccount) as ClassType<TAccountEntity>,

    signUp,
    password: {
      enabled: AUTH_OPTIONS.providers?.password ? true : false,
      validatePassword:
        AUTH_OPTIONS.providers?.password?.settings?.bcrypt?.validatePassword ?? validatePassword,
      passwordHash:
        AUTH_OPTIONS.providers?.password?.settings?.bcrypt?.passwordHash ?? passwordHash,
      passwordVerify:
        AUTH_OPTIONS.providers?.password?.settings?.bcrypt?.passwordVerify ?? passwordVerify,
    },
    otp: { enabled: AUTH_OPTIONS.providers?.otp ? true : false },

    verifiedMethod: AUTH_OPTIONS.verifiedMethod ?? 'auto',
    redirectUrl,

    firstlyData,
    transformDbUserToClientUser: transformDbUserToClientUserToUse,
    uiStaticPath,

    session: {
      expiresInMs: AUTH_OPTIONS.session?.expiresIn ?? 1000 * 60 * 60 * 24 * 30, // 30 days,
      cookieName: AUTH_OPTIONS.session?.COOKIE_NAME ?? 'firstly_auth_session',
    },

    providers: AUTH_OPTIONS.providers,
  }
}

export const authModuleRaw = new Module({
  name: 'auth',
  priority: -777,
})

/**
 * To enable authentication in your app in a few lines of code.
 * _Info: index: -777_
 */
export const auth = <
  TUserEntity extends FFAuthUser = FFAuthUser,
  TSessionEntity extends FFAuthUserSession = FFAuthUserSession,
  TAccountEntity extends FFAuthAccount = FFAuthAccount,
>(
  o: AuthOptions<TUserEntity, TSessionEntity, TAccountEntity>,
) => {
  // TODO should work ?
  // @ts-ignore
  AUTH_OPTIONS = o
  const oSafe = getSafeOptions<TUserEntity, TSessionEntity, TAccountEntity>()

  // Replace the direct assignments with the new _setImplementation method
  AuthController._setAbstraction({
    signOut: AuthControllerServer.signOut,
    signInDemo: AuthControllerServer.signInDemo,
    invite: AuthControllerServer.invite,
    signUpPassword: AuthControllerServer.signUpPassword,
    signInPassword: AuthControllerServer.signInPassword,
    forgotPassword: AuthControllerServer.forgotPassword,
    resetPassword: AuthControllerServer.resetPassword,
    signInOTP: AuthControllerServer.signInOTP,
    verifyOtp: AuthControllerServer.verifyOtp,
    signInOAuthGetUrl: AuthControllerServer.signInOAuthGetUrl,
  })

  authModuleRaw.entities = [oSafe.User, oSafe.Session, oSafe.Account]
  authModuleRaw.controllers = [AuthController]
  authModuleRaw.initRequest = async (event) => {
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
  }
  authModuleRaw.initApi = async () => {
    await initRoleFromEnv(authModuleRaw.log, oSafe.User, 'FF_ROLE_ADMIN', FF_Role.FF_Role_Admin)
    await initRoleFromEnv(
      authModuleRaw.log,
      oSafe.User,
      'FF_ROLE_AUTH_ADMIN',
      FF_Role_Auth.FF_Role_Auth_Admin,
    )
  }
  return authModuleRaw
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
