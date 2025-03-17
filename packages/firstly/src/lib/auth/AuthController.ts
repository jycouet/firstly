import { BackendMethod } from 'remult'

import { FF_Role_Auth } from './Entities'
import type { AuthServerAbstraction, ProviderConfigured } from './types'

export class AuthController {
	static #server: AuthServerAbstraction

	// Internal setter method that can be used by the module
	static _setAbstraction(impl: AuthServerAbstraction) {
		this.#server = impl
	}

	/**
	 * Sign out the current user
	 */
	@BackendMethod({ allowed: true })
	static async signOut() {
		return await AuthController.#server.signOut()
	}

	/**
	 * Sign in with a demo account
	 * _(The easiest way to demo & test your application)_
	 */
	@BackendMethod({ allowed: true })
	static async signInDemo(name: string) {
		return await AuthController.#server.signInDemo(name)
	}

	/**
	 * This is for login / password authentication Invite someone
	 */
	@BackendMethod({ allowed: FF_Role_Auth.FF_Role_Auth_Invite })
	static async invite(email: string) {
		return await AuthController.#server.invite(email)
	}

	/**
	 * This is for login / password authentication SignUp
	 */
	@BackendMethod({ allowed: true })
	static async signUpPassword(email: string, password: string) {
		return await AuthController.#server.signUpPassword(email, password)
	}

	/**
	 * This is for login / password authentication SignIn
	 */
	@BackendMethod({ allowed: true })
	static async signInPassword(email: string, password: string) {
		return await AuthController.#server.signInPassword(email, password)
	}

	/**
	 * Forgot your password ? Send a mail to reset it.
	 */
	@BackendMethod({ allowed: true })
	static async forgotPassword(email: string) {
		return await AuthController.#server.forgotPassword(email)
	}

	/**
	 * Reset your password with a token
	 */
	@BackendMethod({ allowed: true })
	static async resetPassword(token: string, password: string) {
		return await AuthController.#server.resetPassword(token, password)
	}

	/** OTP */
	@BackendMethod({ allowed: true })
	static async signInOTP(email: string) {
		return await AuthController.#server.signInOTP(email)
	}

	/**
	 * Verify the OTP code
	 */
	@BackendMethod({ allowed: true })
	static async verifyOtp(email: string, otp: string) {
		return await AuthController.#server.verifyOtp(email, otp)
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
		return await AuthController.#server.signInOAuthGetUrl(o)
	}
}
