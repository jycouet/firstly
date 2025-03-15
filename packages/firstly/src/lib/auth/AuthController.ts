import { BackendMethod } from 'remult'

import { FF_Role_Auth } from './Entities'
import type { ProviderConfigured } from './types'

export class AuthController {
	// Private static fields
	static #signOutFn: any
	static #signInDemoFn: any
	static #inviteFn: any
	static #signUpPasswordFn: any
	static #signInPasswordFn: any
	static #forgotPasswordFn: any
	static #resetPasswordFn: any
	static #signInOTPFn: any
	static #verifyOtpFn: any
	static #signInOAuthGetUrlFn: any

	// Internal setter method that can be used by the module
	static _setAbstraction(impl: {
		signOut: any
		signInDemo: any
		invite: any
		signUpPassword: any
		signInPassword: any
		forgotPassword: any
		resetPassword: any
		signInOTP: any
		verifyOtp: any
		signInOAuthGetUrl: any
	}) {
		this.#signOutFn = impl.signOut
		this.#signInDemoFn = impl.signInDemo
		this.#inviteFn = impl.invite
		this.#signUpPasswordFn = impl.signUpPassword
		this.#signInPasswordFn = impl.signInPassword
		this.#forgotPasswordFn = impl.forgotPassword
		this.#resetPasswordFn = impl.resetPassword
		this.#signInOTPFn = impl.signInOTP
		this.#verifyOtpFn = impl.verifyOtp
		this.#signInOAuthGetUrlFn = impl.signInOAuthGetUrl
	}

	/**
	 * Sign out the current user
	 */
	@BackendMethod({ allowed: true })
	static async signOut() {
		return await AuthController.#signOutFn()
	}

	/**
	 * Sign in with a demo account
	 * _(The easiest way to demo & test your application)_
	 */
	@BackendMethod({ allowed: true })
	static async signInDemo(name: string) {
		return await AuthController.#signInDemoFn(name)
	}

	/**
	 * This is for login / password authentication Invite someone
	 */
	@BackendMethod({ allowed: FF_Role_Auth.FF_Role_Auth_Invite })
	static async invite(email: string) {
		return await AuthController.#inviteFn(email)
	}

	/**
	 * This is for login / password authentication SignUp
	 */
	@BackendMethod({ allowed: true })
	static async signUpPassword(email: string, password: string) {
		return await AuthController.#signUpPasswordFn(email, password)
	}

	/**
	 * This is for login / password authentication SignIn
	 */
	@BackendMethod({ allowed: true })
	static async signInPassword(email: string, password: string) {
		return await AuthController.#signInPasswordFn(email, password)
	}

	/**
	 * Forgot your password ? Send a mail to reset it.
	 */
	@BackendMethod({ allowed: true })
	static async forgotPassword(email: string) {
		return await AuthController.#forgotPasswordFn(email)
	}

	/**
	 * Reset your password with a token
	 */
	@BackendMethod({ allowed: true })
	static async resetPassword(token: string, password: string) {
		return await AuthController.#resetPasswordFn(token, password)
	}

	/** OTP */
	@BackendMethod({ allowed: true })
	static async signInOTP(email: string) {
		return await AuthController.#signInOTPFn(email)
	}

	/**
	 * Verify the OTP code
	 */
	@BackendMethod({ allowed: true })
	static async verifyOtp(email: string, otp: string) {
		return await AuthController.#verifyOtpFn(email, otp)
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
	static async signInOAuthGetUrl<T extends keyof ProviderConfigured>(o: {
		provider: T
		options?: ProviderConfigured[T]
		redirect?: string
	}) {
		return await AuthController.#signInOAuthGetUrlFn(o)
	}
}
