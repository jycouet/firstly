import { redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

import { handleGuard } from '$lib/auth/server'
import { route } from '$lib2/ROUTES'

import { handleAuth } from './lib/auth/server/handleAuth'
import { api as handleRemult } from './server/api'

export const handle = sequence(
	handleRemult,
	handleAuth({ redirect }),
	handleGuard({
		guard: [{ path: '/ui*' }],
		login: route('/auth'),
		redirect,
	}),
)
