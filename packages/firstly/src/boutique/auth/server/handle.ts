import type { Handle } from '@sveltejs/kit'
import { svelteKitHandler } from 'better-auth/svelte-kit'

import { building } from '$app/environment'

import { auth } from './auth'
import { forwardAuthSetCookies } from './sessionCookie'

export const handleAuth: Handle = async ({ event, resolve }) => {
	const response = await svelteKitHandler({ event, resolve, auth, building })
	return forwardAuthSetCookies(event, response)
}
