import { Log } from '@kitql/helpers'

import { CarboneLog, CarboneTemplate } from './carboneEntities'

export { Roles_Carbon as Roles_Mail } from './Roles_Carbon'

export const key = 'carbone'

export const log = new Log(key)

export const carbonEntities = {
	CarboneTemplate,
	CarboneLog,
}
