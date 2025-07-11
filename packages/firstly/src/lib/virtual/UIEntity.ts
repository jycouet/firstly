import { Entity, Field, Fields } from 'remult'

import { FF_Fields } from '../internals/FF_Fields.js'
import { StateDemoEnum } from './StateDemoEnum.js'

@Entity('uiEntities', {
	allowApiCrud: true,
	defaultOrderBy: { username: 'asc' },
})
export class UIEntity {
	@Fields.autoIncrement()
	id!: number

	@Fields.createdAt()
	createdAt = new Date()

	@Fields.updatedAt()
	updatedAt = new Date()

	@FF_Fields.string({ caption: "Nom de l'utilisateur", placeholder: 'Jean-Yves', suffix: 'sdsd' })
	username!: string

	@Fields.string({ caption: 'E Mail', inputType: 'email', placeholder: 'prénom.nom@se.com' })
	email!: string

	@FF_Fields.string({
		caption: 'Mot de passe',
		inputType: 'password',
		placeholder: '********',
		includeInApi: false,
		minLength: 6,
		allowNull: false,
	})
	password!: string

	// @Field(() => Profile, {
	//
	// 	lazy: true,
	// 	allowNull: true,
	// 	inputType: 'selectEntity',
	// })
	// profile?: Profile

	@Field(() => StateDemoEnum, { inputType: 'selectEnum' })
	state!: StateDemoEnum

	@Fields.json({ allowNull: true })
	permissions? = []

	@Fields.cuid()
	cuid!: string

	@Fields.boolean({ allowNull: true })
	isSubContractor?: boolean

	@Fields.number({ allowNull: true, suffix: '%' })
	rate?: number

	@Fields.date({ allowNull: true, allowApiUpdate: false })
	arrivalDate?: Date

	@FF_Fields.dateOnly({ allowNull: true })
	arrivalDateOnly?: Date
}
