import { Log } from '@kitql/helpers'

import { Mail } from './Mail'

export { Roles_Mail } from './Roles_Mail'
export type { MailSection } from './types'

export const key = 'mail'

export const log = new Log(key)

export const mailEntities = {
	Mail,
}
