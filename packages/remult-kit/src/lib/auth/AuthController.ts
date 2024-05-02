import { generateCodeVerifier, generateState } from 'arctic'
import { DEV } from 'esm-env'
import { generateId } from 'lucia'
import { createDate, TimeSpan } from 'oslo'

import { BackendMethod, remult } from 'remult'
import { yellow } from '@kitql/helpers'

import { AUTH_OPTIONS, getSafeOptions, logAuth, lucia, type AuthorizationURLOptions } from '.'
import { AuthProvider } from './Entities.js'
import { createSession } from './helper'
import { mergeRoles } from './RoleController'

async function getArgon() {
  const { Argon2id } = await import('oslo/password')
  return new Argon2id({
    ...AUTH_OPTIONS.providers?.password?.argon2Settings,
  })
}

async function passwordVerify(hash: string, password: string) {
  const argon = await getArgon()
  return await argon.verify(hash, password)
}

async function passwordHash(password: string) {
  const argon = await getArgon()
  return await argon.hash(password)
}

function checkPassword(password: string) {
  if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
    throw Error('Invalid password')
  }
}

export class AuthController {
  /**
   * Sign out the current user
   */
  @BackendMethod({ allowed: true })
  static async signOut() {
    if (remult.user?.session.id) {
      await lucia.invalidateSession(remult.user?.session.id)
    }
    // Lucia is advertising for createBlankSessionCookie (and not delete Cookie)
    // remult.context.deleteCookie(lucia.sessionCookieName, { path: '/' })
    const sessionCookie = lucia.createBlankSessionCookie()
    remult.context.setCookie(sessionCookie.name, sessionCookie.value, {
      path: '/',
      ...sessionCookie.attributes,
    })
  }

  /**
   * Sign in with a demo account
   * _(The easiest way to demo & test your application)_
   */
  @BackendMethod({ allowed: true })
  static async signInDemo(name: string) {
    const accounts = AUTH_OPTIONS.providers?.demo ?? []
    if (accounts.length === 0) {
      throw new Error(`Demo accounts are not enabled!`)
    }

    const account = accounts.find((a) => a.name === name)
    if (!account) {
      throw new Error(`${name} not found as demo account!`)
    }

    const oSafe = getSafeOptions()
    let user = await remult.repo(oSafe.User).findFirst({ name })

    if (!user) {
      user = remult.repo(oSafe.User).create()
    }
    user.name = name
    const r = mergeRoles(user.roles, account.roles)
    user.roles = r.roles

    await remult.repo(oSafe.User).save(user)

    await createSession(user.id)

    return "You're in with demo account!"
  }

  /**
   * This is for login / password authentication SignUp
   * _(The first param `name` can be "anything")_
   */
  @BackendMethod({ allowed: true })
  static async signUpPassword(email: string, password: string) {
    const oSafe = getSafeOptions()

    const selfSignUp = AUTH_OPTIONS.providers?.password?.selfSignUp ?? true
    if (!selfSignUp) {
      throw Error("You can't signup by yourself ! Contact the administrator.")
    }

    const existingUser = await remult.repo(oSafe.User).findOne({ where: { name: email } })
    if (existingUser) {
      throw Error("You can't signup twice !")
    }

    checkPassword(password)
    const user = await remult.repo(oSafe.User).insert({
      name: email,
    })

    await remult.repo(oSafe.Account).insert({
      provider: AuthProvider.PASSWORD.id,
      providerUserId: email,
      userId: user.id,
      hashPassword: await passwordHash(password),
    })

    await createSession(user.id)

    return 'ok'
  }

  /**
   * This is for login / password authentication SignIn
   * _(The first param `name` can be "anything")_
   */
  @BackendMethod({ allowed: true })
  static async signInPassword(email: string, password: string) {
    const oSafe = getSafeOptions()
    const existingUser = await remult
      .repo(oSafe.User)
      .findOne({ where: { name: email }, include: { accounts: true } })

    const accountPassword = existingUser?.accounts.find(
      (c) => c.provider === AuthProvider.PASSWORD.id,
    )
    if (accountPassword) {
      const validPassword = await passwordVerify(
        accountPassword?.hashPassword ?? '',
        password ?? '',
      )
      if (validPassword) {
        await createSession(existingUser.id)

        return 'ok'
      }
      throw Error('Incorrect username or password')
    }
    throw Error('Incorrect username or password.')
  }

  /**
   * Forgot your password ? Send a mail to reset it.
   */
  @BackendMethod({ allowed: true })
  static async forgotPassword(email: string) {
    const oSafe = getSafeOptions()
    const u = await remult.repo(getSafeOptions().User).findFirst({ name: email })

    if (u) {
      const authAccount = await remult.repo(oSafe.Account).findFirst({
        userId: u.id,
      })

      const token = generateId(40)
      authAccount.token = token
      authAccount.expiresAt = createDate(
        new TimeSpan(AUTH_OPTIONS.providers?.password?.resetPasswordExpiresIn ?? 5 * 60, 's'),
      )

      await remult.repo(oSafe.Account).save(authAccount)
      if (AUTH_OPTIONS.providers?.password?.resetPassword) {
        const url = `${remult.context.url.origin}/auth/resetPassword?token=${token}`
        await AUTH_OPTIONS.providers?.password.resetPassword(url)
        logAuth.success(url)
        return 'Mail sent !'
      } else {
        logAuth.error(`You need to provide a password.resetPassword hook in the auth options!`)
      }
    } else {
      throw new Error("Une erreur est survenue, contacte l'administrateur!")
    }
    return 'Hum, something went wrong !'
  }

  /**
   * Reset your password with a token
   */
  @BackendMethod({ allowed: true })
  static async resetPassword(token: string, password: string) {
    const oSafe = getSafeOptions()
    const account = await remult
      .repo(oSafe.Account)
      .findFirst({ token, provider: AuthProvider.PASSWORD.id })

    if (!account) {
      throw new Error('Invalid token')
    }
    if (account.expiresAt && account.expiresAt < new Date()) {
      throw new Error('token expired')
    }
    checkPassword(password)
    await lucia.invalidateUserSessions(account.userId)

    // update elements
    account.hashPassword = await passwordHash(password)
    account.token = undefined
    account.expiresAt = undefined

    await remult.repo(oSafe.Account).save(account)

    await createSession(account.userId)

    return 'reseted'
  }

  /** OTP */
  @BackendMethod({ allowed: true })
  static async signInOTP(email: string) {
    if (AUTH_OPTIONS.providers?.otp?.send) {
      const { createTOTPKeyURI } = await import('oslo/otp')
      const { encodeHex } = await import('oslo/encoding')
      const { TOTPController } = await import('oslo/otp')

      const secret = crypto.getRandomValues(new Uint8Array(20))
      const otp = await new TOTPController({
        period: new TimeSpan(AUTH_OPTIONS.providers?.otp.expiresIn ?? 30, 's'),
        digits: AUTH_OPTIONS.providers?.otp.digits ?? 6,
      }).generate(secret)

      const secretEncoded = encodeHex(secret)

      const issuer = AUTH_OPTIONS.providers.otp.issuer ?? 'remult-kit'

      const uri = createTOTPKeyURI(issuer, email, secret)
      const oSafe = getSafeOptions()
      let user = await remult.repo(oSafe.User).findFirst({ name: email })
      if (!user) {
        user = remult.repo(oSafe.User).create()
      }
      user.name = email

      user = await remult.repo(oSafe.User).save(user)

      let account = await remult
        .repo(oSafe.Account)
        .findFirst({ userId: user.id, provider: AuthProvider.OTP.id })
      if (!account) {
        account = remult.repo(oSafe.Account).create()
      }
      account.userId = user.id
      account.provider = AuthProvider.OTP.id
      account.token = otp
      account.hashPassword = secretEncoded

      await remult.repo(oSafe.Account).save(account)

      await AUTH_OPTIONS.providers.otp?.send({ name: email, otp, uri })
      logAuth.success(`name: ${yellow(email)}, otp: ${yellow(otp)}, uri: ${yellow(uri)}`)
      return 'Mail sent !'
    } else {
      logAuth.error(`You need to provide a otp.send hook in the auth options!`)
    }
    throw new Error(`OPT is not enabled!`)
  }

  /**
   * Verify the OTP code
   */
  @BackendMethod({ allowed: true })
  static async verifyOtp(otp: string | number, email: string) {
    const oSafe = getSafeOptions()

    const accounts = await remult.repo(oSafe.Account).find({
      where: { token: String(otp), provider: AuthProvider.OTP.id },
    })

    if (accounts.length === 0) {
      throw new Error('Invalid otp')
    }
    const account = accounts[0]
    const user = await remult.repo(oSafe.User).findId(account.userId)

    if (user.name !== email) {
      throw new Error('Invalid otp.')
    }

    const { decodeHex } = await import('oslo/encoding')
    const { TOTPController } = await import('oslo/otp')

    const secretDecoded = decodeHex(account.hashPassword ?? '')

    const validOTP = await new TOTPController().verify(String(otp), secretDecoded)

    if (!validOTP) {
      throw new Error('Invalid otp!')
    }
    await lucia.invalidateUserSessions(account.userId)

    // update elements
    account.hashPassword = undefined
    account.token = undefined
    account.expiresAt = undefined

    await remult.repo(oSafe.Account).save(account)

    await createSession(account.userId)

    return 'verified'
  }

  /** OAUTH */
  /**
   * The the url to redirect to for the OAuth provider
   * @param provider Has to mach one of `AUTH_OPTIONS.providers.oAuths` your configured
   *
   * To be used like this for example:
   * ```
   * const url = await AuthController.signInOAuthGetUrl('github')
   * window.location.href = url
   * ```
   *
   * _(popup example should work too, and a nice example/componant would be appreciated)_
   */
  @BackendMethod({ allowed: true })
  static async signInOAuthGetUrl<T extends keyof AuthorizationURLOptions>(o: {
    provider: T
    options?: AuthorizationURLOptions[T]
    redirect?: string
  }) {
    const selectedOAuth = AUTH_OPTIONS.providers?.oAuths?.find((c) => c.name === o.provider)
    if (selectedOAuth) {
      const state = generateState()
      try {
        const arcticProvider = selectedOAuth.getArcticProvider()
        const args: any = [state]

        if (selectedOAuth.isPKCE) {
          const codeVerifier = generateCodeVerifier()
          args.push(codeVerifier)

          // store code verifier as cookie
          remult.context.setCookie('code_verifier', codeVerifier, {
            secure: true, // set to false in localhost
            path: '/',
            httpOnly: true,
            maxAge: 60 * 10, // 10 min
          })
        }

        if (o.options) {
          args.push(o.options)
        } else {
          if (selectedOAuth.authorizationURLOptions) {
            args.push(selectedOAuth.authorizationURLOptions())
          }
        }
        // @ts-ignore
        const url = await arcticProvider.createAuthorizationURL(...args)

        if (!url) {
          throw new Error('No url returned')
        }

        remult.context.setCookie(`${o.provider}_oauth_state`, state, {
          path: '/',
          secure: !DEV,
          httpOnly: true,
          maxAge: 60 * 10,
          sameSite: 'lax',
        })

        if (o.redirect) {
          remult.context.setCookie(`remult_redirect`, o.redirect, {
            path: '/',
            secure: !DEV,
            httpOnly: true,
            maxAge: 60 * 10,
            sameSite: 'lax',
          })
        }

        return url.toString()
      } catch (error) {
        // display error for the server only
        logAuth.error(error)
        throw new Error(`${o.provider} not well configured!`)
      }
    }

    throw new Error(`${o.provider} is not configured!`)
  }
}
