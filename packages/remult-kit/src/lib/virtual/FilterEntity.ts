import { Entity, Fields } from 'remult'

import { KitFields } from '../KitFields.js'

@Entity('filterEntities', {})
export class FilterEntity {
	@KitFields.string({ allowNull: true, caption: 'Rechercher par' })
	search: string = ''

	@KitFields.string({ allowNull: false, caption: 'Titre' })
	title: string = ''

	@Fields.boolean()
	is = true

	@Fields.boolean({ caption: 'Même adresse', allowNull: true })
	sameAdress = true
}
