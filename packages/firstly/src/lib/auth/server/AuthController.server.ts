import { generateCodeVerifier, generateState } from 'arctic'
import { createDate, TimeSpan } from 'oslo'

import { EntityError, remult } from 'remult'
import { green, magenta, yellow } from '@kitql/helpers'

import { sendMail } from '../../mail/server/index.js'
import { FFAuthProvider } from '../Entities.js'
import { logAuth } from '../index.js'
import { invalidateSession } from './helperDb.js'
import { ff_createSession } from './helperFirstly.js'
import { generateAndEncodeToken } from './helperOslo.js'
import {
  deleteSessionTokenCookie,
  setCodeVerifierCookie,
  setOAuthStateCookie,
  setRedirectCookie,
} from './helperRemultServer.js'
import { mergeRoles } from './helperRole.js'
import { AUTH_OPTIONS, getSafeOptions, type AuthorizationURLOptions } from './module.js'

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
    throw new EntityError({ message: 'Invalid password' })
  }
}

export class AuthControllerServer {
  /**
   * Sign out the current user
   */
  static async signOut() {
    if (remult.user?.session.id) {
      await invalidateSession(remult.user?.session.id)
    }
    deleteSessionTokenCookie()
  }

  /**
   * Sign in with a demo account
   * _(The easiest way to demo & test your application)_
   */
  static async signInDemo(name: string) {
    const accounts = AUTH_OPTIONS.providers?.demo ?? []
    if (accounts.length === 0) {
      throw new EntityError({ message: `Demo accounts are not enabled!` })
    }

    const account = accounts.find((a) => a.name === name)
    if (!account) {
      throw new EntityError({ message: `${name} not found as demo account!` })
    }

    const oSafe = getSafeOptions()
    let user = await remult.repo(oSafe.User).findFirst({ identifier: name })

    if (!user) {
      user = remult.repo(oSafe.User).create()
    }
    user.identifier = name
    const r = mergeRoles(user.roles, account.roles)
    user.roles = r.roles

    await remult.repo(oSafe.User).save(user)

    await ff_createSession(user.id)

    return "You're in with demo account!"
  }

  /**
   * This is for login / password authentication invite
   */
  static async invite(emailParam: string) {
    const email = emailParam.toLowerCase()
    const oSafe = getSafeOptions()

    const existingAccount = await remult.repo(oSafe.Account).findOne({
      where: {
        providerUserId: email,
        provider: FFAuthProvider.PASSWORD.id,
      },
    })
    if (existingAccount) {
      // Already invited, it's all good.
    } else {
      const token = generateAndEncodeToken()

      // TODO: Do we create the user or just the account ?!
      // TODO 2: Invite is by mail... But the invitee can log with another provider... So what do we do?! maybe not checking the provider... and updating?
      // const user = await remult.repo(oSafe.User).insert({
      //   identifier: email,
      // })

      await remult.repo(oSafe.Account).insert({
        provider: FFAuthProvider.PASSWORD.id,
        providerUserId: email,
        // userId: user.id,
        // hashPassword: await passwordHash(password),
        token: token,
        expiresAt: createDate(
          new TimeSpan(AUTH_OPTIONS.providers?.password?.verifyMailExpiresIn ?? 5 * 60, 's'),
        ),
        lastVerifiedAt: undefined,
      })

      const url = `${remult.context.request.url.origin}${oSafe.firstlyData.props.ui?.paths.reset_password}?token=${token}`

      if (AUTH_OPTIONS?.invitationSend) {
        await AUTH_OPTIONS?.invitationSend({ email, url })
        logAuth.success(`${green('[custom]')}${magenta('[invitationSend]')} (${yellow(url)})`)
        return 'Mail sent !'
      } else {
        await sendMail('invitationSend', {
          to: email,
          subject: 'Invitation',

          templateProps: {
            title: 'Invitation 👋',
            previewText: 'This is the mail you were waiting for',
            sections: [
              {
                text: 'Today is your lucky day !',
                highlighted: true,
              },
              {
                text: 'You were invited to join the team',
                cta: {
                  text: 'JOIN',
                  link: url,
                },
              },
            ],
          },
        })

        logAuth.success(`${magenta('[invitationSend]')} (${yellow(url)})`)
        return 'Demo Mail sent !'
      }
    }

    return 'ok'
  }

  /**
   * This is for login / password authentication SignUp
   * _(The first param `email` can be "anything")_
   */
  static async signUpPassword(emailParam: string, password: string) {
    const email = emailParam.toLowerCase()

    const oSafe = getSafeOptions()

    if (!oSafe.signUp) {
      throw new EntityError({ message: "You can't signup by yourself! Contact the administrator." })
    }

    if (!oSafe.password_enabled) {
      throw new EntityError({ message: 'Password is not enabled!' })
    }

    const existingAccount = await remult.repo(oSafe.Account).findOne({
      where: {
        providerUserId: email,
        provider: FFAuthProvider.PASSWORD.id,
      },
    })
    if (existingAccount) {
      throw new EntityError({ message: "You can't signup twice !" })
    }

    checkPassword(password)
    const token = generateAndEncodeToken()

    await remult.dataProvider.transaction(async () => {
      const user = await remult.repo(oSafe.User).insert({
        identifier: email,
      })
      await remult.repo(oSafe.Account).insert({
        provider: FFAuthProvider.PASSWORD.id,
        providerUserId: email,
        userId: user.id,
        hashPassword: await passwordHash(password),
        token: oSafe.verifiedMethod === 'auto' ? undefined : token,
        expiresAt:
          oSafe.verifiedMethod === 'auto'
            ? undefined
            : createDate(
                new TimeSpan(AUTH_OPTIONS.providers?.password?.verifyMailExpiresIn ?? 5 * 60, 's'),
              ),
        lastVerifiedAt: oSafe.verifiedMethod === 'auto' ? new Date() : undefined,
      })
    })

    if (oSafe.verifiedMethod === 'auto') {
      const user = await remult.repo(oSafe.User).findFirst({
        identifier: email,
      })
      if (user) {
        await ff_createSession(user.id)
      }
    } else {
      const url = `${remult.context.request.url.origin}${oSafe.firstlyData.props.ui?.paths.verify_email}?token=${token}`
      if (AUTH_OPTIONS.providers?.password?.verifyMailSend) {
        await AUTH_OPTIONS.providers?.password.verifyMailSend({ email, url })
        logAuth.success(`${green('[custom]')}${magenta('[verifyMailSend]')} (${yellow(url)})`)
      } else {
        await sendMail('verifyMailSend', {
          to: email,
          subject: 'Wecome',

          templateProps: {
            title: 'Wecome 👋',
            previewText: 'This is the mail you were waiting for',
            sections: [
              {
                text: 'You can validate your account',
                cta: {
                  text: 'HERE',
                  link: url,
                },
              },
            ],
          },
        })

        logAuth.success(`${magenta('[verifyMailSend]')} (${yellow(url)})`)
      }
    }

    return 'ok'
  }

  /**
   * This is for login / password authentication SignIn
   * _(The first param `email` can be "anything")_
   */
  static async signInPassword(emailParam: string, password: string) {
    const email = emailParam.toLowerCase()
    const oSafe = getSafeOptions()

    if (!oSafe.password_enabled) {
      throw new EntityError({ message: 'Password is not enabled!' })
    }

    const existingAccount = await remult.repo(oSafe.Account).findOne({
      where: {
        providerUserId: email,
        provider: FFAuthProvider.PASSWORD.id,
      },
    })

    if (existingAccount) {
      const validPassword = await passwordVerify(
        existingAccount?.hashPassword ?? '',
        password ?? '',
      )
      if (validPassword) {
        await ff_createSession(existingAccount.userId)

        return 'ok'
      }
      throw new EntityError({ message: 'Incorrect username or password' })
    }

    throw new EntityError({ message: 'Incorrect username or password.' })
  }

  /**
   * Forgot your password ? Send a mail to reset it.
   */
  static async forgotPassword(emailParam: string) {
    const email = emailParam.toLowerCase()
    const oSafe = getSafeOptions()

    if (!oSafe.password_enabled) {
      throw new EntityError({ message: 'Password is not enabled!' })
    }

    const existingAccount = await remult.repo(oSafe.Account).findOne({
      where: {
        providerUserId: email,
        provider: FFAuthProvider.PASSWORD.id,
      },
    })

    if (existingAccount) {
      const token = generateAndEncodeToken()
      existingAccount.token = token
      existingAccount.expiresAt = createDate(
        new TimeSpan(AUTH_OPTIONS.providers?.password?.resetPasswordExpiresIn ?? 5 * 60, 's'),
      )

      await remult.repo(oSafe.Account).save(existingAccount)

      const url = `${remult.context.request.url.origin}${oSafe.firstlyData.props.ui?.paths.reset_password}?token=${token}`
      if (AUTH_OPTIONS.providers?.password?.resetPasswordSend) {
        await AUTH_OPTIONS.providers?.password.resetPasswordSend({ email, url })
        logAuth.success(`${green('[custom]')}${magenta('[resetPasswordSend]')} (${yellow(url)})`)
        return 'Mail sent !'
      } else {
        await sendMail('resetPasswordSend', {
          to: email,
          subject: 'Reset your password',

          templateProps: {
            title: 'Reset your password 👋',
            previewText: 'This is the mail you were waiting for',
            sections: [
              {
                text: 'Did you forgot something ?',
                highlighted: true,
              },
              {
                text: 'No worries, you can reset your password',
                cta: {
                  text: 'HERE',
                  link: url,
                },
              },
            ],
          },
        })

        logAuth.success(`${magenta('[resetPasswordSend]')} (${yellow(url)})`)
        return 'Demo Mail sent !'
      }
    }
    throw new EntityError({ message: "Une erreur est survenue, contacte l'administrateur!" })
  }

  /**
   * Reset your password with a token
   */
  static async resetPassword(token: string, password: string) {
    const oSafe = getSafeOptions()

    if (!oSafe.password_enabled) {
      throw new EntityError({ message: 'Password is not enabled!' })
    }

    const account = await remult
      .repo(oSafe.Account)
      .findFirst({ token, provider: FFAuthProvider.PASSWORD.id })

    if (!account) {
      throw new EntityError({ message: 'Invalid token' })
    }
    if (account.expiresAt && account.expiresAt < new Date()) {
      throw new EntityError({ message: 'token expired' })
    }
    checkPassword(password)

    if (account.userId === undefined) {
      const user = await remult.repo(oSafe.User).insert({ identifier: account.providerUserId })
      account.userId = user.id
    }

    await invalidateSession(account.userId)

    // update elements
    account.hashPassword = await passwordHash(password)
    account.token = undefined
    account.expiresAt = undefined
    account.lastVerifiedAt = new Date()

    await remult.repo(oSafe.Account).save(account)

    await ff_createSession(account.userId)

    return 'reseted'
  }

  /** OTP */
  static async signInOTP(emailParam: string) {
    const email = emailParam.toLowerCase()
    const oSafe = getSafeOptions()

    if (!oSafe.otp_enabled) {
      throw new EntityError({ message: `OPT is not enabled!` })
    }

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

      const issuer = AUTH_OPTIONS.providers.otp.issuer ?? 'firstly'

      const uri = createTOTPKeyURI(issuer, email, secret)
      const oSafe = getSafeOptions()
      let user = await remult.repo(oSafe.User).findFirst({ identifier: email })
      if (!user) {
        user = remult.repo(oSafe.User).create()
      }
      user.identifier = email

      user = await remult.repo(oSafe.User).save(user)

      let account = await remult
        .repo(oSafe.Account)
        .findFirst({ userId: user.id, provider: FFAuthProvider.OTP.id })
      if (!account) {
        account = remult.repo(oSafe.Account).create()
      }
      account.userId = user.id
      account.provider = FFAuthProvider.OTP.id
      account.token = otp
      account.hashPassword = secretEncoded

      await remult.repo(oSafe.Account).save(account)

      await AUTH_OPTIONS.providers.otp?.send({ name: email, otp, uri })
      logAuth.success(`name: ${yellow(email)}, otp: ${yellow(otp)}, uri: ${yellow(uri)}`)
      return 'Mail sent !'
    } else {
      logAuth.error(`You need to provide a otp.send hook in the auth options!`)
    }
    return 'Hum, something went wrong !'
  }

  /**
   * Verify the OTP code
   */
  static async verifyOtp(emailParam: string, otp: string | number) {
    const email = emailParam.toLowerCase()
    const oSafe = getSafeOptions()

    const accounts = await remult.repo(oSafe.Account).find({
      where: { token: String(otp), provider: FFAuthProvider.OTP.id },
    })

    if (accounts.length === 0) {
      throw new EntityError({ message: 'Invalid otp' })
    }
    const account = accounts[0]
    const user = await remult.repo(oSafe.User).findId(account.userId)

    if (user?.identifier !== email) {
      throw new EntityError({ message: 'Invalid otp.' })
    }

    const { decodeHex } = await import('oslo/encoding')
    const { TOTPController } = await import('oslo/otp')

    const secretDecoded = decodeHex(account.hashPassword ?? '')

    const validOTP = await new TOTPController().verify(String(otp), secretDecoded)

    if (!validOTP) {
      throw new EntityError({ message: 'Invalid otp!' })
    }
    await invalidateSession(account.userId)

    // update elements
    account.hashPassword = undefined
    account.token = undefined
    account.expiresAt = undefined

    await remult.repo(oSafe.Account).save(account)

    await ff_createSession(account.userId)

    return 'verified'
  }

  /** OAUTH */
  /**
   * The the url to redirect to for the OAuth provider
   * @param provider Has to mach one of `AUTH_OPTIONS.providers.oAuths` your configured
   *
   * To be used like this for example:
   * ```
   * const url = await Auth.signInOAuthGetUrl('github')
   * window.location.href = url
   * ```
   *
   * _(popup example should work too, and a nice example/componant would be appreciated)_
   */
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

          setCodeVerifierCookie(codeVerifier)
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
          throw new EntityError({ message: 'No url returned' })
        }

        setOAuthStateCookie(o.provider, state)

        if (o.redirect) {
          setRedirectCookie(o.redirect)
        }

        return url.toString()
      } catch (error) {
        // display error for the server only
        logAuth.error(error)
        throw new EntityError({ message: `${o.provider} not well configured!` })
      }
    }

    throw new EntityError({
      message: `${o.provider} is not configured! (Module: auth, section: providers.oAuths: [${o.provider}] missing)`,
    })
  }
}
