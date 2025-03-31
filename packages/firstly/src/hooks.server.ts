import { redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

import { handleGuard } from '$lib/auth/server'
import { route } from '$lib/ROUTES'

import { handleAuth } from './lib/auth/server/handleAuth'
import { api as handleRemult } from './server/api'

export const handle = sequence(
	handleRemult,
	handleAuth,
	handleGuard({
		authenticated: ['/ui/dialog*'],
		redirectToLogin: route('/auth'),
		// redirectToLogin: route('login'),
		redirectAuthenticated: route('/'),
		redirect,
	}),
)
