import { Entity, Fields } from 'remult'

import { KitFields } from '../KitFields'

@Entity('customers', {
	allowApiCrud: true,
})
export class Customer {
	@Fields.cuid()
	id!: string

	@KitFields.string({ caption: 'Nom de la société', placeholder: 'Dynamic Process' })
	name!: string
}
