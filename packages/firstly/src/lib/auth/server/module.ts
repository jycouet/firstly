import type { OAuth2Tokens } from 'arctic'
import bcrypt from 'bcryptjs'

import { EntityError, remult } from 'remult'
import type { ClassType, UserInfo } from 'remult'
import { red, yellow } from '@kitql/helpers'
import { getRelativePackagePath } from '@kitql/internals'

import { env } from '$env/dynamic/private'
import { building } from '$app/environment'

import { AuthController } from '..'
import { Module } from '../../server'
import type { RecursivePartial } from '../../utils/types'
import { FFAuthAccount, FFAuthUser, FFAuthUserSession } from '../Entities'
import type {
	FirstlyData,
	FirstlyDataAuth,
	OAuth2UserInfo,
	ProviderAuthorizationURLOptions,
} from '../types'
import { AuthControllerServer } from './AuthController.server'
import { validateSessionToken } from './helperDb'
import { setSessionTokenCookie } from './helperRemultServer'
import { linkRoleToUsersFromEnv } from './helperRole'

// TODO revalidate token?
export type FFOAuth2Provider<T = any, LitName extends string = string> = {
	name: LitName
	caption: string
	raw_svg?: string
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
	ui?: false | RecursivePartial<FirstlyDataAuth['ui']>

	strings?: {
		resetPasswordSend?: string
		resetPasswordUnknownUser?: string
		anErrorOccurred?: string
		cannotSignUp?: string
	}

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
	 *  `Auto` => noting will be checked
	 *  `Email` => users needs to click a link in an email
	 *  `Manual` => an admin needs to verify the user and set verifiedAt in the database
	 * ```
	 * @default auto
	 **/
	verifiedMethod?: 'auto' | 'email' | 'manual'

	invitationSend?: (args: { email: string; url: string }) => Promise<void>

	/**
	 * When defining this, you need to return a "manually constructed object" that will be used to send to the client.
	 * This is useful if you want to add some extra properties to the user object.
	 *
	 * @example
	 * ```ts
	 * transformDbUserToClientUser(session, user) {
	 * 	return {
	 * 		id: user.id,
	 * 		name: user.name,
	 * 		image: user.image ?? undefined,
	 * 		session: {
	 * 			id: session.id,
	 * 			expiresAt: session.expiresAt,
	 * 		},
	 * 	}
	 * }
	 * ```
	 */
	transformDbUserToClientUser?: (session: TSessionEntity, user: TUserEntity) => UserInfo

	providers?: {
		demo?: {
			name: string
			roles?: string[]
		}[]

		password?: {
			mail?: {
				reset?: {
					send?: (args: { email: string; url: string }) => Promise<void>
					/** in secondes @default 5 minutes */
					expiresIn?: number
				}
				verify?: {
					send?: (args: { email: string; url: string }) => Promise<void>
					/** in secondes @default 5 minutes */
					expiresIn?: number
				}
			}

			algo?: {
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
				validateInput?: ({ identifier, password }: { identifier: string; password: string }) => void
				/**
				 * If you want to NOT use the default bcrypt, you can pass your own thing!
				 */
				hash?: (password: string) => Promise<string>
				/**
				 * If you want to NOT use the default bcrypt, you can pass your own thing!
				 */
				verify?: (password: string, hash: string) => Promise<boolean>

				bcrypt?: {
					/**
					 * The number of rounds to use for the bcrypt hash.
					 * @default 10
					 */
					saltRounds?: number
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

	envRoles_AssignUsers?: Record<string, string>
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

	const ui =
		AUTH_OPTIONS.ui === false
			? undefined
			: ({
					paths: {
						base,
						sign_up: signUp ? buildUrlOrDefault(base, AUTH_OPTIONS.ui?.paths?.sign_up, 'sign-up') : false,
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
						verify_email: buildUrlOrDefault(base, AUTH_OPTIONS.ui?.paths?.verify_email, 'verify-email'),
					},
					strings: {
						app_name: AUTH_OPTIONS.ui?.strings?.app_name ?? '',
						email: AUTH_OPTIONS.ui?.strings?.email ?? 'Email',
						email_placeholder: AUTH_OPTIONS.ui?.strings?.email_placeholder ?? 'Your email address',
						password: AUTH_OPTIONS.ui?.strings?.password ?? 'Password',
						password_placeholder: AUTH_OPTIONS.ui?.strings?.password_placeholder ?? 'Your password',
						confirm: AUTH_OPTIONS.ui?.strings?.confirm ?? 'Confirm',
						reset: AUTH_OPTIONS.ui?.strings?.reset ?? 'Reset',
						btn_sign_up: AUTH_OPTIONS.ui?.strings?.btn_sign_up ?? 'Sign up',
						btn_sign_in: AUTH_OPTIONS.ui?.strings?.btn_sign_in ?? 'Sign in',
						forgot_password: AUTH_OPTIONS.ui?.strings?.forgot_password ?? 'Forgot your password?',
						send_password_reset_instructions:
							AUTH_OPTIONS.ui?.strings?.send_password_reset_instructions ??
							'Send password reset instructions',
						back_to_sign_in: AUTH_OPTIONS.ui?.strings?.back_to_sign_in ?? 'Back to sign in',
					},
					images: {
						main: AUTH_OPTIONS.ui?.images?.main ?? '',
					},
					customHtmlHead:
						AUTH_OPTIONS.ui?.customHtmlHead ??
						'<title>Auth</title><link rel="icon" href="https://firstly.fun/favicon.svg" />',
				} as const)

	if (AUTH_OPTIONS.debug && !building) {
		authModuleRaw.log.info('ui', ui)
	}

	const getProviderIcon = (name: string) => {
		switch (name) {
			case 'github':
				return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`
			case 'google':
				return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><!-- Icon from Devicon by konpa - https://github.com/devicons/devicon/blob/master/LICENSE --><path fill="#fff" d="M44.59 4.21a63.28 63.28 0 0 0 4.33 120.9a67.6 67.6 0 0 0 32.36.35a57.13 57.13 0 0 0 25.9-13.46a57.44 57.44 0 0 0 16-26.26a74.3 74.3 0 0 0 1.61-33.58H65.27v24.69h34.47a29.72 29.72 0 0 1-12.66 19.52a36.2 36.2 0 0 1-13.93 5.5a41.3 41.3 0 0 1-15.1 0A37.2 37.2 0 0 1 44 95.74a39.3 39.3 0 0 1-14.5-19.42a38.3 38.3 0 0 1 0-24.63a39.25 39.25 0 0 1 9.18-14.91A37.17 37.17 0 0 1 76.13 27a34.3 34.3 0 0 1 13.64 8q5.83-5.8 11.64-11.63c2-2.09 4.18-4.08 6.15-6.22A61.2 61.2 0 0 0 87.2 4.59a64 64 0 0 0-42.61-.38"/><path fill="#e33629" d="M44.59 4.21a64 64 0 0 1 42.61.37a61.2 61.2 0 0 1 20.35 12.62c-2 2.14-4.11 4.14-6.15 6.22Q95.58 29.23 89.77 35a34.3 34.3 0 0 0-13.64-8a37.17 37.17 0 0 0-37.46 9.74a39.25 39.25 0 0 0-9.18 14.91L8.76 35.6A63.53 63.53 0 0 1 44.59 4.21"/><path fill="#f8bd00" d="M3.26 51.5a63 63 0 0 1 5.5-15.9l20.73 16.09a38.3 38.3 0 0 0 0 24.63q-10.36 8-20.73 16.08a63.33 63.33 0 0 1-5.5-40.9"/><path fill="#587dbd" d="M65.27 52.15h59.52a74.3 74.3 0 0 1-1.61 33.58a57.44 57.44 0 0 1-16 26.26c-6.69-5.22-13.41-10.4-20.1-15.62a29.72 29.72 0 0 0 12.66-19.54H65.27c-.01-8.22 0-16.45 0-24.68"/><path fill="#319f43" d="M8.75 92.4q10.37-8 20.73-16.08A39.3 39.3 0 0 0 44 95.74a37.2 37.2 0 0 0 14.08 6.08a41.3 41.3 0 0 0 15.1 0a36.2 36.2 0 0 0 13.93-5.5c6.69 5.22 13.41 10.4 20.1 15.62a57.13 57.13 0 0 1-25.9 13.47a67.6 67.6 0 0 1-32.36-.35a63 63 0 0 1-23-11.59A63.7 63.7 0 0 1 8.75 92.4"/></svg>`
			default:
				return ''
		}
	}

	const providers =
		AUTH_OPTIONS.providers?.oAuths?.map((o) => ({
			name: o.name,
			label: o.caption,
			raw_svg: o.raw_svg ?? getProviderIcon(o.name),
		})) ?? []

	const firstlyData: FirstlyData = {
		module: 'auth',
		debug: AUTH_OPTIONS.debug,
		props: {
			ui,
			providers,
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
				name: user.name,
				roles: user.roles,
				session: {
					id: session.id,
					expiresAt: session.expiresAt,
				},
			}
		}
	}

	function validateInput({ identifier, password }: { identifier: string; password: string }) {
		if (typeof identifier !== 'string' || identifier.length === 0) {
			throw new EntityError({ message: 'Invalid identifier' })
		}
		if (typeof password !== 'string') {
			throw new EntityError({ message: 'Invalid password' })
		}
		if (password.length < 6 || password.length > 255) {
			throw new EntityError({ message: 'Password too short or too long!' })
		}
	}

	function passwordHash(password: string) {
		return bcrypt.hashSync(password, AUTH_OPTIONS.providers?.password?.algo?.bcrypt?.saltRounds ?? 10)
	}

	function passwordVerify(password: string, hash: string) {
		return bcrypt.compareSync(password, hash)
	}

	return {
		User: (AUTH_OPTIONS.customEntities?.User ?? FFAuthUser) as ClassType<TUserEntity>,
		Session: (AUTH_OPTIONS.customEntities?.Session ?? FFAuthUserSession) as ClassType<TSessionEntity>,
		Account: (AUTH_OPTIONS.customEntities?.Account ?? FFAuthAccount) as ClassType<TAccountEntity>,

		signUp,
		password: {
			enabled: AUTH_OPTIONS.providers?.password ? true : false,
			validateInput: AUTH_OPTIONS.providers?.password?.algo?.validateInput ?? validateInput,
			hash: AUTH_OPTIONS.providers?.password?.algo?.hash ?? passwordHash,
			verify: AUTH_OPTIONS.providers?.password?.algo?.verify ?? passwordVerify,
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

		strings: {
			resetPasswordSend:
				AUTH_OPTIONS.strings?.resetPasswordSend ?? 'Mail sent ! You can now close this window.',
			resetPasswordUnknownUser:
				AUTH_OPTIONS.strings?.resetPasswordUnknownUser ??
				'If your email is registered, you will receive an email with a link to reset your password.',
			anErrorOccurred:
				AUTH_OPTIONS.strings?.anErrorOccurred ?? 'An error occurred, contact the administrator.',
			cannotSignUp:
				AUTH_OPTIONS.strings?.cannotSignUp ??
				"You can't signup by yourself! Contact the administrator.",
		},

		ui,

		envRoles_AssignUsers: AUTH_OPTIONS.envRoles_AssignUsers ?? {},
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
		const oSafe = getSafeOptions()
		for (const [key, value] of Object.entries(oSafe.envRoles_AssignUsers)) {
			await linkRoleToUsersFromEnv({
				log: authModuleRaw.log,
				accountEntity: oSafe.Account,
				userEntity: oSafe.User,
				envKey: key.toUpperCase(),
				envValue: env[key.toUpperCase()] ?? '',
				roles: [value],
			})
		}

		if (Object.entries(oSafe.envRoles_AssignUsers).length === 0 && AUTH_OPTIONS.debug) {
			authModuleRaw.log.info(
				`set ${yellow('auth: { linkRoleToUsersFromEnv: ... }')} to assign roles to users via ${yellow('.env')}.`,
			)
		}
	}

	return authModuleRaw
}

declare module 'remult' {
	export interface UserInfo {
		session: {
			id: string
			expiresAt: Date
		}
	}
}
