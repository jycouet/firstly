import { Entity, Field, Fields, remult, ValueListFieldType } from 'remult'

import { Roles_Carbon } from './Roles_Carbon'

@ValueListFieldType()
export class CarbonLogAction {
	static template_upload = new CarbonLogAction('TEMPLATE_UPLOAD')
	static template_download = new CarbonLogAction('TEMPLATE_DOWNLOAD')
	static template_delete = new CarbonLogAction('TEMPLATE_DELETE')
	static render = new CarbonLogAction('RENDER')
	constructor(public id: string) {}
}

@Entity<CarboneTemplate>('carboneTemplates', {
	allowApiCrud: Roles_Carbon.Carbon_Admin,
	allowApiRead: Roles_Carbon.Carbon_ViewTemplate,
	defaultOrderBy: { updatedAt: 'desc' },
})
export class CarboneTemplate {
	@Fields.string({ required: true })
	id!: string

	@Fields.updatedAt()
	updatedAt = new Date()

	@Fields.string({ required: true })
	name!: string

	@Fields.string({ required: true })
	extension = ''
}

@Entity<CarboneLog>('carboneLogs', {
	allowApiCrud: Roles_Carbon.Carbon_Admin,
	defaultOrderBy: { updatedAt: 'desc' },
})
export class CarboneLog {
	@Fields.id()
	id!: string

	@Fields.updatedAt()
	updatedAt = new Date()

	@Fields.string<CarboneLog>({
		saving: (item) => {
			item.userId = remult.user?.id ?? ''
		},
	})
	userId = ''

	@Field(() => CarbonLogAction)
	action: CarbonLogAction = CarbonLogAction.template_upload

	@Fields.string({ required: true })
	templateId = ''
}
