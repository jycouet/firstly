import { Entity, Fields } from 'remult'

import { FF_Fields } from '../FF_Fields'

@Entity('customers', {
	allowApiCrud: true,
})
export class Customer {
	@Fields.cuid()
	id!: string

	@FF_Fields.string({ caption: 'Nom de la société', placeholder: 'Dynamic Process' })
	name!: string
}
