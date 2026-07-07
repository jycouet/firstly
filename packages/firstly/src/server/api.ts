import Database from 'better-sqlite3'

import { repo, SqlDatabase } from 'remult'
import { BetterSqlite3DataProvider } from 'remult/remult-better-sqlite3'
import { remultApi } from 'remult/remult-sveltekit'
import { carbone } from 'firstly/carbone/server'
import { changeLog } from 'firstly/changeLog/server'

import { ApiItem } from '$modules/demo/ApiItem'
import { Task } from '$modules/demo/Task'
import { MailController } from '$modules/mail/MailController'
import { task } from '$modules/task/server'
import { mail } from '$lib/mail/server'

import { ev } from './_evlog'

// File-based SQLite so SQL spans, durations, and persistence are visible in dev.
// Drop the file or use ':memory:' for a fresh slate every restart.
// Memoized + lazy so SvelteKit's build-time SSR analysis doesn't construct the
// native SQLite handle, while still letting other modules reuse the same provider.
// TODO: investigate if remult can handle this natively:
//  - expose the resolved provider on `api.dataProvider` (avoid hand-rolled memoization),
//  - and/or skip eager dataProvider resolution when SvelteKit's `building` flag is true,
//    so `initApi`/`remultApi` don't trigger native bindings during build/prerender.
let _dataProvider: SqlDatabase | undefined
export const getDataProvider = () => {
	if (!_dataProvider) {
		_dataProvider = new SqlDatabase(new BetterSqlite3DataProvider(new Database('demo.db')))
	}
	return _dataProvider
}

export const api = remultApi({
	dataProvider: async () => getDataProvider(),
	admin: true,
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
		ev.module,
		changeLog(),
		task({ seed: true }),

		mail({
			from: 'noreply@firstly.fun',
			service: 'Firstly',
		}),

		carbone({
			CARBONE_API_KEY: 'test_1234567890',
		}),
	],
})
