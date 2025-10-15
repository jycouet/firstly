import { Entity, Fields } from 'remult'

@Entity('customers', {
	allowApiCrud: true,
})
export class Customer {
	@Fields.id()
	id!: string

	@Fields.string({ required: true, caption: 'Nom de la société', placeholder: 'Dynamic Process' })
	name!: string
}
