import { Entity, Fields } from 'remult'

import { Role_Mail } from './Role_Mail'

const statuses = ['transport_not_configured', 'sent', 'error'] as const
type StatusType = (typeof statuses)[number]

@Entity<Mail>('_ff_mails', {
	caption: 'Mails',
	allowApiCrud: Role_Mail.Mail_Admin,
	defaultOrderBy: { createdAt: 'desc' },
})
export class Mail {
	@Fields.cuid()
	id?: string

	@Fields.createdAt()
	createdAt = new Date()

	@Fields.string({ required: true })
	topic!: string

	@Fields.string({ required: true })
	to!: string

	@Fields.json()
	metadata: Record<string, any> = {}

	@Fields.string()
	html = ''

	@Fields.literal(() => statuses)
	status: StatusType = 'sent'

	@Fields.string()
	errorInfo = ''
}
