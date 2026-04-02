import { carbone } from 'firstly/carbone/server'
import { FF_Role } from 'firstly/internals'

import { MailController } from '$modules/mail/MailController'
import { task } from '$modules/task/server'
import { mail } from '$lib/mail/server'
import { firstly, ModuleFF } from '$lib/server'

const Role = {
	...FF_Role,
	Admin: 'admin',
} as const

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

		task({ specialInfo: 'Hello from the server' }),
	],
})
