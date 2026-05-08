import { BackendMethod } from 'remult'

import { Roles_Evlog } from '../evlogEntities.js'
import { purgeEvlog } from './remultDrains.js'

/**
 * Manual purge endpoint exposed for admin tooling. The `evlog()` module
 * already runs `purgeEvlog` on a timer - this controller is for one-off
 * runs ("clean up now, I'm low on disk") and dashboards that want to
 * surface a button.
 *
 * Audit rows are intentionally untouched.
 */
export class EvlogPurgeController {
	@BackendMethod({ allowed: Roles_Evlog.Evlog_Admin })
	static async purgeOlderThan(days: number = 90): Promise<{ traces: number; queries: number }> {
		return purgeEvlog({ days })
	}
}
