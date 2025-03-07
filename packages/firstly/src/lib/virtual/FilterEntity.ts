import { Entity, Fields } from 'remult'

// import { FF_Fields } from '../FF_Fields.js'

@Entity('filterEntities', {})
export class FilterEntity {
	@Fields.string({ allowNull: true, caption: 'Rechercher par' })
	search: string = ''

	@Fields.string({ allowNull: false, caption: 'Titre' })
	title: string = ''

	@Fields.boolean()
	is = true

	@Fields.boolean({ caption: 'Même adresse', allowNull: true })
	sameAdress = true

	@Fields.number({ allowNull: false, caption: 'number' })
	number: number = 200
}
