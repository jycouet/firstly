import { decodeHex, encodeHexLowerCase } from '@oslojs/encoding'
import { createTOTPKeyURI, generateTOTP, verifyTOTPWithGracePeriod } from '@oslojs/otp'
import { generateState } from 'arctic'

import { EntityError, remult, repo } from 'remult'
import { green, magenta, yellow } from '@kitql/helpers'

import { sendMail } from '../../mail/server/index.js'
import { FFAuthProvider } from '../Entities.js'
import { invalidateSession } from './helperDb.js'
import { ff_createSession } from './helperFirstly.js'
import { createDate, generateAndEncodeToken } from './helperOslo.js'
import {
  deleteSessionTokenCookie,
  setOAuthStateCookie,
  setRedirectCookie,
} from './helperRemultServer.js'
import { mergeRoles } from './helperRole.js'
import { AUTH_OPTIONS, authModuleRaw, getSafeOptions, type ProviderConfigured } from './module.js'

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
    let user = await repo(oSafe.User).findFirst({ identifier: name })

    if (!user) {
      user = repo(oSafe.User).create()
    }
    user.identifier = name
    const r = mergeRoles(user.roles, account.roles)
    user.roles = r.roles

    await repo(oSafe.User).save(user)

    await ff_createSession(user.id)

    return "You're in with demo account!"
  }

  /**
   * This is for login / password authentication invite
   */
  static async invite(emailParam: string) {
    const email = emailParam.toLowerCase()

    const oSafe = getSafeOptions()

    const existingAccount = await repo(oSafe.Account).findOne({
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
      // const user = await repo(oSafe.User).insert({
      //   identifier: email,
      // })

      await repo(oSafe.Account).insert({
        provider: FFAuthProvider.PASSWORD.id,
        providerUserId: email,
        // userId: user.id,
        // hashPassword: await passwordHash(password),
        token: token,
        expiresAt: createDate(AUTH_OPTIONS.providers?.password?.mail?.verify?.expiresIn ?? 5 * 60),
        lastVerifiedAt: undefined,
      })

      const url = `${remult.context.request.url.origin}${oSafe.firstlyData.props.ui?.paths.reset_password}?token=${token}`

      if (AUTH_OPTIONS?.invitationSend) {
        await AUTH_OPTIONS?.invitationSend({ email, url })
        authModuleRaw.log.success(
          `${green('[custom]')}${magenta('[invitationSend]')} (${yellow(url)})`,
        )
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

        authModuleRaw.log.success(`${magenta('[invitationSend]')} (${yellow(url)})`)
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
    const oSafe = getSafeOptions()
    if (!oSafe.signUp) {
      throw new EntityError({ message: oSafe.strings.cannotSignUp })
    }

    if (!oSafe.password.enabled) {
      throw new EntityError({ message: 'Password is not enabled!' })
    }

    const email = emailParam.toLowerCase()
    oSafe.password.validateInput({ identifier: email, password })

    const existingAccount = await repo(oSafe.Account).findOne({
      where: {
        providerUserId: email,
        provider: FFAuthProvider.PASSWORD.id,
      },
    })
    if (existingAccount) {
      throw new EntityError({ message: "You can't signup twice !" })
    }

    const token = generateAndEncodeToken()

    await remult.dataProvider.transaction(async () => {
      const user = await repo(oSafe.User).insert({
        identifier: email,
      })
      await repo(oSafe.Account).insert({
        provider: FFAuthProvider.PASSWORD.id,
        providerUserId: email,
        userId: user.id,
        hashPassword: await oSafe.password.hash(password),
        token: oSafe.verifiedMethod === 'auto' ? undefined : token,
        expiresAt:
          oSafe.verifiedMethod === 'auto'
            ? undefined
            : createDate(AUTH_OPTIONS.providers?.password?.mail?.verify?.expiresIn ?? 5 * 60),
        lastVerifiedAt: oSafe.verifiedMethod === 'auto' ? new Date() : undefined,
      })
    })

    if (oSafe.verifiedMethod === 'auto') {
      const user = await repo(oSafe.User).findFirst({
        identifier: email,
      })
      if (user) {
        await ff_createSession(user.id)
      }
    } else {
      const url = `${remult.context.request.url.origin}${oSafe.firstlyData.props.ui?.paths.verify_email}?token=${token}`
      if (AUTH_OPTIONS.providers?.password?.mail?.verify?.send) {
        await AUTH_OPTIONS.providers?.password.mail.verify.send({ email, url })
        authModuleRaw.log.success(
          `${green('[custom]')}${magenta('[verifyMailSend]')} (${yellow(url)})`,
        )
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

        authModuleRaw.log.success(`${magenta('[verifyMailSend]')} (${yellow(url)})`)
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
    oSafe.password.validateInput({ identifier: email, password })

    if (!oSafe.password.enabled) {
      throw new EntityError({ message: 'Password is not enabled!' })
    }

    const existingAccount = await repo(oSafe.Account).findOne({
      where: {
        providerUserId: email,
        provider: FFAuthProvider.PASSWORD.id,
      },
    })

    if (existingAccount) {
      const validPassword = oSafe.password.verify(
        password ?? '',
        existingAccount?.hashPassword ?? '',
      )
      if (validPassword) {
        await ff_createSession(existingAccount.userId)

        return 'ok'
      }

      authModuleRaw.log.error({ email, passwordLength: password.length })
      throw new EntityError({ message: 'Incorrect username or password' })
    }

    authModuleRaw.log.error({ email, passwordLength: password.length })
    throw new EntityError({ message: 'Incorrect username or password.' })
  }

  /**
   * Forgot your password ? Send a mail to reset it.
   */
  static async forgotPassword(emailParam: string) {
    const email = emailParam.toLowerCase()
    const oSafe = getSafeOptions()

    if (!oSafe.password.enabled) {
      throw new EntityError({ message: 'Password is not enabled!' })
    }

    const existingAccount = await repo(oSafe.Account).findOne({
      where: {
        providerUserId: email,
        provider: FFAuthProvider.PASSWORD.id,
      },
    })

    if (existingAccount) {
      const token = generateAndEncodeToken()
      existingAccount.token = token
      existingAccount.expiresAt = createDate(
        AUTH_OPTIONS.providers?.password?.mail?.reset?.expiresIn ?? 5 * 60,
      )

      await repo(oSafe.Account).save(existingAccount)

      const url = `${remult.context.request.url.origin}${oSafe.firstlyData.props.ui?.paths.reset_password}?token=${token}`
      if (AUTH_OPTIONS.providers?.password?.mail?.reset?.send) {
        await AUTH_OPTIONS.providers?.password.mail.reset.send({ email, url })
        authModuleRaw.log.success(
          `${green('[custom]')}${magenta('[resetPasswordSend]')} (${yellow(url)})`,
        )
        return oSafe.strings.resetPasswordSend
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

        authModuleRaw.log.success(`${magenta('[resetPasswordSend]')} (${yellow(url)})`)
        return `Demo | ${oSafe.strings.resetPasswordSend}`
      }
    }
    throw new EntityError({ message: oSafe.strings.anErrorOccurred })
  }

  /**
   * Reset your password with a token
   */
  static async resetPassword(token: string, password: string) {
    const oSafe = getSafeOptions()

    if (!oSafe.password.enabled) {
      throw new EntityError({ message: 'Password is not enabled!' })
    }
    oSafe.password.validateInput({ identifier: 'resetPassword', password })

    const account = await remult
      .repo(oSafe.Account)
      .findFirst({ token, provider: FFAuthProvider.PASSWORD.id })

    if (!account) {
      throw new EntityError({ message: 'Invalid token' })
    }
    if (account.expiresAt && account.expiresAt < new Date()) {
      throw new EntityError({ message: 'token expired' })
    }

    if (account.userId === undefined) {
      const user = await repo(oSafe.User).insert({ identifier: account.providerUserId })
      account.userId = user.id
    }

    await invalidateSession(account.userId)

    // update elements
    account.hashPassword = await oSafe.password.hash(password)
    account.token = undefined
    account.expiresAt = undefined
    account.lastVerifiedAt = new Date()

    await repo(oSafe.Account).save(account)

    await ff_createSession(account.userId)

    return 'reseted'
  }

  /** OTP */
  static async signInOTP(emailParam: string) {
    const email = emailParam.toLowerCase()
    const oSafe = getSafeOptions()

    if (!oSafe.otp.enabled) {
      throw new EntityError({ message: `OPT is not enabled!` })
    }

    if (AUTH_OPTIONS.providers?.otp?.send) {
      const key = crypto.getRandomValues(new Uint8Array(20))
      const intervalInSeconds = AUTH_OPTIONS.providers?.otp?.expiresIn ?? 30
      const digits = AUTH_OPTIONS.providers?.otp.digits ?? 6
      const otp = generateTOTP(key, intervalInSeconds, digits)

      const keyEncoded = encodeHexLowerCase(key)

      const issuer = AUTH_OPTIONS.providers.otp.issuer ?? 'firstly'

      const uri = createTOTPKeyURI(issuer, email, key, intervalInSeconds, digits)
      const oSafe = getSafeOptions()
      let user = await repo(oSafe.User).findFirst({ identifier: email })
      if (!user) {
        user = repo(oSafe.User).create()
      }
      user.identifier = email

      user = await repo(oSafe.User).save(user)

      let account = await remult
        .repo(oSafe.Account)
        .findFirst({ userId: user.id, provider: FFAuthProvider.OTP.id })
      if (!account) {
        account = repo(oSafe.Account).create()
      }
      account.userId = user.id
      account.provider = FFAuthProvider.OTP.id
      account.token = otp
      account.hashPassword = keyEncoded

      await repo(oSafe.Account).save(account)

      await AUTH_OPTIONS.providers.otp?.send({ name: email, otp, uri })
      authModuleRaw.log.success(`name: ${yellow(email)}, otp: ${yellow(otp)}, uri: ${yellow(uri)}`)
      return 'Mail sent !'
    } else {
      authModuleRaw.log.error(`You need to provide a otp.send hook in the auth options!`)
    }
    return 'Hum, something went wrong !'
  }

  /**
   * Verify the OTP code
   */
  static async verifyOtp(emailParam: string, otp: string) {
    const email = emailParam.toLowerCase()
    const oSafe = getSafeOptions()

    if (!oSafe.otp.enabled) {
      throw new EntityError({ message: `OPT is not enabled!` })
    }

    const accounts = await repo(oSafe.Account).find({
      where: { token: String(otp), provider: FFAuthProvider.OTP.id },
    })

    if (accounts.length === 0) {
      throw new EntityError({ message: 'Invalid otp' })
    }
    const account = accounts[0]
    const user = await repo(oSafe.User).findId(account.userId)

    if (user?.identifier !== email) {
      throw new EntityError({ message: 'Invalid otp.' })
    }

    const intervalInSeconds = oSafe.providers?.otp?.expiresIn ?? 30
    const digits = oSafe.providers?.otp?.digits ?? 6
    const keyDecoded = decodeHex(account.hashPassword ?? '')

    const validOTP = verifyTOTPWithGracePeriod(keyDecoded, intervalInSeconds, digits, otp, 30)

    if (!validOTP) {
      throw new EntityError({ message: 'Invalid otp!' })
    }
    await invalidateSession(account.userId)

    // update elements
    account.hashPassword = undefined
    account.token = undefined
    account.expiresAt = undefined

    await repo(oSafe.Account).save(account)

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
  static async signInOAuthGetUrl<T extends keyof ProviderConfigured>(o: {
    provider: T
    options?: ProviderConfigured[T]
    redirect?: string
  }) {
    const selectedOAuth = AUTH_OPTIONS.providers?.oAuths?.find((c) => c.name === o.provider)
    if (selectedOAuth) {
      const state = generateState()
      try {
        const arcticProvider = selectedOAuth.getArcticProvider()
        const args: any = [state]

        if (o.options) {
          args.push(o.options)
        } else {
          if (selectedOAuth.authorizationURLOptions) {
            args.push(selectedOAuth.authorizationURLOptions())
          }
        }

        const url = await arcticProvider.createAuthorizationURL(...args)

        if (!url) {
          throw new EntityError({ message: 'No url returned' })
        }

        setOAuthStateCookie(selectedOAuth.name, state)

        if (o.redirect) {
          setRedirectCookie(o.redirect)
        }

        return url.toString()
      } catch (error) {
        // display error for the server only
        authModuleRaw.log.error(error)
        throw new EntityError({ message: `${selectedOAuth.name} not well configured!` })
      }
    }

    throw new EntityError({
      message: `${o.provider} is not configured! (Module: auth, section: providers.oAuths: [${o.provider}] missing)`,
    })
  }
}
