import { remultApi } from 'remult/remult-sveltekit'
import { carbone } from 'firstly/carbone/server'

import { MailController } from '$modules/mail/MailController'
import { mail } from '$lib/mail/server'

export const api = remultApi({
	controllers: [MailController],
	modules: [
		mail({
			from: 'noreply@firstly.fun',
			service: 'Firstly',
		}),

		carbone({
			CARBONE_API_KEY: 'test_1234567890',
		}),
	],
})
