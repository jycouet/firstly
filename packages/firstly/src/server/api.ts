import { remultApi } from 'remult/remult-sveltekit'
import { repo } from 'remult'
import { carbone } from 'firstly/carbone/server'

import { ApiItem } from '$modules/demo/ApiItem'
import { Task } from '$modules/demo/Task'
import { MailController } from '$modules/mail/MailController'
import { mail } from '$lib/mail/server'

export const api = remultApi({
	entities: [Task, ApiItem],
	controllers: [MailController],
	initApi: async () => {
		if ((await repo(ApiItem).count()) === 0) {
			await repo(ApiItem).insert([
				{ title: 'public item', pub: true },
				{ title: 'private item', pub: false },
			])
		}
	},
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
