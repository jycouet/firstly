import { Entity, Fields } from 'remult'

// import { KitFields } from '../KitFields.js'

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
