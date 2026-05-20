import { Log } from '@kitql/helpers'

import { Mail } from './Mail'

export { Mail } from './Mail'
export { MailController } from './MailController'
export { Roles_Mail } from './Roles_Mail'
export type { MailSection } from './types'

export { default as WriteMail } from './ui/WriteMail.svelte'
export { default as LastMails } from './ui/LastMails.svelte'

export const key = 'mail'

export const log = new Log(key)

export const mailEntities = {
	Mail,
}
