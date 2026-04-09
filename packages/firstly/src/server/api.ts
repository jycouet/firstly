import { carbone } from 'firstly/carbone/server'

import { MailController } from '$modules/mail/MailController'
import { mail } from '$lib/mail/server'
import { firstly, ModuleFF } from '$lib/server'

export const api = firstly({
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

	modulesFF: [
		new ModuleFF({
			name: 'theEnd',
			async initApi() {},
		}),
	],
})
