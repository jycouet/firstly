import { remultAdapter } from '@nerdfolio/remult-better-auth'
import { betterAuth } from 'better-auth'

import { remult, withRemult } from 'remult'

import { sendMail } from '../../../lib/mail/server'
import { authEntities } from '../entities'

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET ?? 'firstly-dev-insecure-secret',
	baseURL: process.env.BETTER_AUTH_URL,
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

	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			// better-auth may run this as a background task, outside remult's request cycle.
			// withRemult establishes a context; we then populate `remult.context.sendMail`
			// the same way the mail module's `initRequest` does, so we can use the firstly idiom.

			// TODO: remove withRemult?
			await withRemult(async () => {
				remult.context.sendMail = sendMail
				await remult.context.sendMail('auth-reset-password', {
					to: user.email,
					subject: 'Reset your password',
					title: 'Reset your password',
					sections: [
						{
							html: `<p>Hi ${user.name || 'there'},</p>
								<p>We received a request to reset your password. Click the button below to choose a new one.</p>
								<p style="color:#666;font-size:12px">If you didn't request this, you can ignore this email.</p>`,
							cta: { html: 'Reset password', link: url },
						},
					],
				})
			})
		},
	},
})
