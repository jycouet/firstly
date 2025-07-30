import { Entity, Fields } from 'remult'

import { FF_Fields } from '../internals/FF_Fields'

@Entity('customers', {
	allowApiCrud: true,
})
export class Customer {
	@Fields.id()
	id!: string

	@FF_Fields.string({ caption: 'Nom de la société', placeholder: 'Dynamic Process' })
	name!: string
}
