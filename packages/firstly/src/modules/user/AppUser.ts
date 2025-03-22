import { Fields } from 'remult'

import { FF_Entity } from '$lib'
import { FFAuthUser } from '$lib/auth'

@FF_Entity<_AppUser>('app_users', {
	dbName: 'app_users',
	// this overrides the default CRUD... So be carefull !
	// allowApiCrud: true,
	saved(e) {
		console.info(`Yop ${e.identifier} 👋`)
	},
	allowApiUpdate: (item, r) => {
		if (item && r?.user?.id) {
			return item.id === r.user.id
		}
		return false
	},
})
export class _AppUser extends FFAuthUser {
	@Fields.string()
	jobTitle: string = 'CEO'

	@Fields.string()
	theme: 'default' | 'daisy' | 'empty' = 'daisy'
}
