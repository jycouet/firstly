import { remultApi } from 'remult/remult-sveltekit'
import { carbone } from 'firstly/carbone/server'

import { MailController } from '$modules/mail/MailController'
import { mail } from '$lib/mail/server'
import { auth } from '../boutique/auth/server/module'

export const api = remultApi({
	controllers: [MailController],
	modules: [
		auth({
			SUPER_ADMIN_EMAILS: process.env.SUPER_ADMIN_EMAILS,
		}),

		mail({
			from: 'noreply@firstly.fun',
			service: 'Firstly',
		}),

		carbone({
			CARBONE_API_KEY: 'test_1234567890',
		}),
	],
})
