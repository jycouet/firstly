import { redirect, type Handle } from '@sveltejs/kit'
import type { OAuth2Tokens } from 'arctic'

import { repo } from 'remult'
import { read } from '@kitql/internals'

import { FFAuthProvider } from '../Entities'
import { ff_createSession } from './helperFirstly'
import { getSafeOptions, type OAuth2UserInfo } from './module'

export const handleAuth: Handle = async ({ event, resolve }) => {
	const oSafe = getSafeOptions()

	if (event.url.pathname === oSafe.firstlyData.props.ui?.paths?.verify_email) {
		const token = event.url.searchParams.get('token') ?? ''

		if (!oSafe.password.enabled) {
			throw Error('Password is not enabled!')
		}

		const account = await repo(oSafe.Account).findFirst({
			token,
			provider: FFAuthProvider.PASSWORD.id,
		})

		if (!account) {
			throw new Error('Invalid token')
		}
		if (account.expiresAt && account.expiresAt < new Date()) {
			throw new Error('token expired')
		}

		// update elements
		account.token = undefined
		account.expiresAt = undefined
		account.lastVerifiedAt = new Date()

		await repo(oSafe.Account).save(account)

		await ff_createSession(account.userId)

		redirect(302, oSafe.redirectUrl)
	}

	if (
		oSafe.firstlyData.props.ui?.paths?.base &&
		event.url.pathname.startsWith(oSafe.firstlyData.props.ui.paths.base)
	) {
		let content = read(`${oSafe.uiStaticPath}index.html`) ?? ''

		content = content?.replaceAll('<!--PLACE_HERE_HEAD-->', oSafe.ui?.customHtmlHead ?? '')

		return new Response(
			content + `<script>const firstlyData = ${JSON.stringify(oSafe.firstlyData)}</script>`,
			{
				headers: { 'content-type': 'text/html' },
			},
		)
	}

	if (event.url.pathname.startsWith('/api/static')) {
		const content = read(`${oSafe.uiStaticPath}${event.url.pathname.replaceAll('/api/static/', '')}`)
		if (content) {
			const seg = event.url.pathname.split('.')
			const map: Record<string, string> = {
				js: 'text/javascript',
				css: 'text/css',
				svg: 'image/svg+xml',
			}

			return new Response(content, {
				headers: { 'content-type': map[seg[seg.length - 1]] ?? 'text/plain' },
			})
		}
	}

	if (event.url.pathname === '/api/auth_callback') {
		const code = event.url.searchParams.get('code')
		const state = event.url.searchParams.get('state')

		const keys = oSafe.providers?.oAuths?.map((c) => c.name) ?? []

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

		const selectedOAuth = oSafe.providers?.oAuths?.find((c) => c.name === keyState)
		if (selectedOAuth && code) {
			const tokens = (await selectedOAuth
				.getArcticProvider()
				.validateAuthorizationCode(code)) as OAuth2Tokens
			let info: OAuth2UserInfo
			try {
				info = await selectedOAuth.getUserInfo(tokens)
			} catch (error) {
				console.error(error)
				redirect(302, redirectUrl)
			}

			if (!info.providerUserId) {
				redirect(302, redirectUrl)
			}

			let account = await repo(oSafe.Account).findFirst({
				provider: keyState,
				providerUserId: info.providerUserId,
			})
			if (!account) {
				if (!oSafe.signUp) {
					console.error("You can't signup by yourself! Contact the administrator.")
					// throw Error("You can't signup by yourself! Contact the administrator.")
					redirect(302, redirectUrl)
				}

				// for each info.name, we check if it exists take the first option
				// and add the providerUserId to the name if no option available

				let nameToUse = ''
				for (let i = 0; i < info.nameOptions.length; i++) {
					const existingUser = await repo(oSafe.User).findOne({
						where: { identifier: info.nameOptions[i] },
					})
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

				const user = repo(oSafe.User).create()
				user.identifier = nameToUse
				await repo(oSafe.User).save(user)

				account = repo(oSafe.Account).create()
				account.provider = keyState
				account.providerUserId = info.providerUserId
				account.userId = user.id
			}

			account.lastVerifiedAt = new Date()
			account.token = tokens.accessToken()
			account.metadata = { ...info, tokens_data: tokens.data }
			await repo(oSafe.Account).save(account)

			await ff_createSession(account.userId)

			event.cookies.delete(`${keyState}_oauth_state`, { path: '/' })
			event.cookies.delete(`code_verifier`, { path: '/' })
		}

		redirect(302, redirectUrl)
	}

	return resolve(event)
}
