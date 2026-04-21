import { remultAdapter } from '@nerdfolio/remult-better-auth'
import { betterAuth } from 'better-auth'

import { authEntities } from '../entities'

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET ?? 'firstly-dev-insecure-secret',
	database: remultAdapter({
		// When you `npm run auth:generate` you need to have `authEntities: {}`
		// It generates all entites needed for better-auth. You might need to check diffs in GIT.
		// Help: https://github.com/nerdfolio/remult-better-auth
		authEntities,
		// authEntities: {},
		usePlural: true,
	}),

	user: {
		additionalFields: {
			roles: { type: 'string[]' },
		},
	},

	// config example:
	emailAndPassword: {
		enabled: true,
	},
})
