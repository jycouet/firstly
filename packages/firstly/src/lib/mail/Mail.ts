import { Entity, Fields } from 'remult'

import { Roles_Mail } from './Roles_Mail'

const statuses = ['transport_not_configured', 'sent', 'error'] as const
type StatusType = (typeof statuses)[number]

@Entity<Mail>('_ff_mails', {
	caption: 'FF Mails',
	allowApiCrud: Roles_Mail.Mail_Admin,
	defaultOrderBy: { createdAt: 'desc' },
})
export class Mail {
	@Fields.id()
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
