import { Entity, Fields } from 'remult'

import { Role_Cron } from './Role_Cron'

const statuses = ['starting', 'ended', 'skipped'] as const
type StatusType = (typeof statuses)[number]

@Entity<Cron>('_ff_crons', {
	caption: 'Crons',
	allowApiCrud: Role_Cron.Cron_Admin,
	defaultOrderBy: { startingAt: 'desc' },
})
export class Cron {
	@Fields.cuid()
	id?: string

	@Fields.string({ required: true })
	topic!: string

	@Fields.date()
	startingAt = new Date()

	@Fields.date({ allowNull: true })
	endedAt: Date | null = null

	@Fields.json()
	result: Record<string, any> = {}

	@Fields.literal(() => statuses)
	status: StatusType = 'starting'
}
