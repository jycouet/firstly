import { Entity, Fields } from 'remult'

import { viaAtprotoConfig } from './AtRecord.js'
import { Roles_Atproto } from './Roles_Atproto.js'

export type SpacePolicy = 'public' | 'member-list' | 'managing-app'
export type AppAccess = 'open' | 'allow-list'

/** A permissioned space (`com.atproto.simplespace`). Insert = createSpace, update = updateSpace. */
@Entity<AtSpace>('_at_spaces', {
	caption: 'AT Spaces',
	allowApiCrud: Roles_Atproto.Atproto_Admin,
	id: 'uri',
	dataProvider: viaAtprotoConfig,
	hub: {
		cells: ['type', 'skey', 'readPolicy', 'writePolicy', 'appAccess'],
		insert: { cells: ['type', 'skey', 'readPolicy', 'writePolicy'] },
		delete: {},
	},
})
export class AtSpace {
	static KEY = '_at_spaces'
	@Fields.string({ caption: 'URI', allowApiUpdate: false }) uri = ''
	@Fields.string({ caption: 'Authority (owner did)', allowApiUpdate: false }) authority = ''
	/** NSID describing the modality. */
	@Fields.string({ required: true, caption: 'Type (NSID)' }) type = 'fun.firstly.space'
	/** Tells spaces of the same type apart under one owner. Empty = TID. */
	@Fields.string({ caption: 'Space key' }) skey = 'main'
	@Fields.literal(() => ['public', 'member-list', 'managing-app'] as const) readPolicy: SpacePolicy =
		'member-list'
	@Fields.literal(() => ['public', 'member-list', 'managing-app'] as const)
	writePolicy: SpacePolicy = 'member-list'
	@Fields.string() managingApp = ''
	@Fields.literal(() => ['open', 'allow-list'] as const) appAccess: AppAccess = 'open'
	@Fields.json() allowedApps: string[] = []
	/** False when created with the raw space API: policies above are unknown, members can't be listed. */
	@Fields.boolean({ allowApiUpdate: false }) managed = true
}

/** Member list of a space. Always filter by `space`. */
@Entity<AtSpaceMember>('_at_space_members', {
	caption: 'AT Space members',
	allowApiCrud: Roles_Atproto.Atproto_Admin,
	id: ['space', 'did'],
	dataProvider: viaAtprotoConfig,
	hub: { cells: ['did', 'read', 'write'], delete: {} },
})
export class AtSpaceMember {
	static KEY = '_at_space_members'
	@Fields.string({ caption: 'Space URI', required: true }) space = ''
	@Fields.string({ caption: 'DID', required: true }) did = ''
	@Fields.boolean() read = true
	@Fields.boolean() write = true
}
