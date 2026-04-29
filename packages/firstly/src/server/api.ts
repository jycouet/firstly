import Database from 'better-sqlite3'

import { SqlDatabase } from 'remult'
import { BetterSqlite3DataProvider } from 'remult/remult-better-sqlite3'
import { remultApi } from 'remult/remult-sveltekit'
import { carbone } from 'firstly/carbone/server'
import { changeLog } from 'firstly/changeLog/server'
import { evlog } from 'firstly/evlog/server'

import { MailController } from '$modules/mail/MailController'
import { task } from '$modules/task/server'
import { mail } from '$lib/mail/server'

// File-based SQLite so SQL spans, durations, and persistence are visible in dev.
// Drop the file or use ':memory:' for a fresh slate every restart.
const dataProvider = new SqlDatabase(new BetterSqlite3DataProvider(new Database('demo.db')))

export const api = remultApi({
	dataProvider,
	admin: true,
	controllers: [MailController],
	modules: [
		evlog({ service: 'firstly-demo' }),
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
