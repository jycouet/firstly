import { Allow, BackendMethod } from 'remult'

import type { AuthorizationURLOptions } from './server/module'

export class AuthController {
  // Do not show for firstly users ?
  /** DO NOT USE */
  static signOutFn: any
  /** DO NOT USE */
  static signInDemoFn: any
  /** DO NOT USE */
  static inviteFn: any
  /** DO NOT USE */
  static signUpPasswordFn: any
  /** DO NOT USE */
  static signInPasswordFn: any
  /** DO NOT USE */
  static forgotPasswordFn: any
  /** DO NOT USE */
  static resetPasswordFn: any
  /** DO NOT USE */
  static signInOTPFn: any
  /** DO NOT USE */
  static verifyOtpFn: any
  /** DO NOT USE */
  static signInOAuthGetUrlFn: any

  /**
   * Sign out the current user
   */
  @BackendMethod({ allowed: true })
  static async signOut() {
    return await AuthController.signOutFn()
  }

  /**
   * Sign in with a demo account
   * _(The easiest way to demo & test your application)_
   */
  @BackendMethod({ allowed: true })
  static async signInDemo(name: string) {
    return await AuthController.signInDemoFn(name)
  }

  /**
   * This is for login / password authentication Invite someone
   */
  @BackendMethod({ allowed: Allow.authenticated })
  static async invite(email: string) {
    return await AuthController.inviteFn(email)
  }

  /**
   * This is for login / password authentication SignUp
   */
  @BackendMethod({ allowed: true })
  static async signUpPassword(email: string, password: string) {
    return await AuthController.signUpPasswordFn(email, password)
  }

  /**
   * This is for login / password authentication SignIn
   */
  @BackendMethod({ allowed: true })
  static async signInPassword(email: string, password: string) {
    return await AuthController.signInPasswordFn(email, password)
  }

  /**
   * Forgot your password ? Send a mail to reset it.
   */
  @BackendMethod({ allowed: true })
  static async forgotPassword(email: string) {
    return await AuthController.forgotPasswordFn(email)
  }

  /**
   * Reset your password with a token
   */
  @BackendMethod({ allowed: true })
  static async resetPassword(token: string, password: string) {
    return await AuthController.resetPasswordFn(token, password)
  }

  /** OTP */
  @BackendMethod({ allowed: true })
  static async signInOTP(email: string) {
    return await AuthController.signInOTPFn(email)
  }

  /**
   * Verify the OTP code
   */
  @BackendMethod({ allowed: true })
  static async verifyOtp(email: string, otp: string | number) {
    return await AuthController.verifyOtpFn(email, otp)
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
  @BackendMethod({ allowed: true })
  static async signInOAuthGetUrl<T extends keyof AuthorizationURLOptions>(o: {
    provider: T
    options?: AuthorizationURLOptions[T]
    redirect?: string
  }) {
    return await AuthController.signInOAuthGetUrlFn(o)
  }
}
