import type { OAuth2Tokens } from 'arctic'

import { Fields, Relations, Validators, ValueListFieldType } from 'remult'

import { BaseEnum, FF_Entity, FF_Role } from '../internals'
import type { BaseEnumOptions } from '../internals'
import type { OAuth2UserInfo } from './types'

export const FF_Role_Auth = {
	FF_Role_Auth_Admin: 'FF_Role_Auth.Admin',
	FF_Role_Auth_Invite: 'FF_Role_Auth.Invite',
} as const

@FF_Entity('ff_auth.users', {
	allowApiCrud: [FF_Role_Auth.FF_Role_Auth_Admin, FF_Role.FF_Role_Admin],
	caption: 'FF Auth - Users',
})
export class FFAuthUser {
	@Fields.cuid()
	id!: string

	@Fields.createdAt({ includeInApi: [FF_Role_Auth.FF_Role_Auth_Admin, FF_Role.FF_Role_Admin] })
	createdAt!: Date

	@Fields.updatedAt({ includeInApi: [FF_Role_Auth.FF_Role_Auth_Admin, FF_Role.FF_Role_Admin] })
	updatedAt?: Date

	@Fields.string<FFAuthUser>({
		required: true,
		validate: [Validators.unique(), Validators.required()],
	})
	name!: string

	@Fields.json<FFAuthUser, string[]>(() => [], {
		includeInApi: [FF_Role_Auth.FF_Role_Auth_Admin, FF_Role.FF_Role_Admin],
		inputType: 'selectEnum',
		valueConverter: {
			toDb: (x) => {
				if (x === null) return null
				if (Array.isArray(x)) return x.join(',')
				return x
			},
			//FIXME: refacto this + remove "permissions" & add a disable user!
			fromDb: (x) => {
				return x
					? x
							.split(',')
							.map((c: string) => c.replace('{', '').replace('}', ''))
							.filter((c: string) => c !== '')
					: []
			},
		},
	})
	roles: string[] = []

	@Relations.toMany<FFAuthUser, FFAuthAccount>(() => FFAuthAccount, 'userId')
	accounts!: FFAuthAccount[]

	@Relations.toMany<FFAuthUser, FFAuthUserSession>(() => FFAuthUserSession, 'userId')
	sessions!: FFAuthUserSession[]
}

@FF_Entity<FFAuthAccount>('ff_auth.accounts', {
	allowApiCrud: [FF_Role_Auth.FF_Role_Auth_Admin, FF_Role.FF_Role_Admin],
	caption: 'FF Auth - Accounts',
	changeLog: {
		excludeColumns: (e) => {
			return [e.hashPassword, e.token]
		},
	},
})
export class FFAuthAccount {
	@Fields.cuid()
	id!: string

	@Fields.createdAt()
	createdAt!: Date

	@Fields.updatedAt()
	updatedAt?: Date

	@Fields.string()
	userId!: string

	@Relations.toOne<FFAuthAccount, FFAuthUser>(() => FFAuthUser, 'userId')
	user!: FFAuthUser

	@Fields.string()
	provider = FFAuthProvider.PASSWORD.id

	@Fields.string()
	providerUserId = ''

	@Fields.string({ allowNull: true })
	email?: string | null = null

	@Fields.string({ includeInApi: false, allowNull: true })
	hashPassword?: string

	@Fields.string({ includeInApi: false, allowNull: true })
	token?: string

	@Fields.date({ includeInApi: false, allowNull: true })
	expiresAt?: Date

	@Fields.date({ includeInApi: false, allowNull: true })
	lastVerifiedAt?: Date

	@Fields.json({ includeInApi: false, allowNull: true })
	metadata?: OAuth2UserInfo & { tokens_data: OAuth2Tokens['data'] }
}

@FF_Entity('ff_auth.users_sessions', {
	allowApiCrud: [FF_Role_Auth.FF_Role_Auth_Admin, FF_Role.FF_Role_Admin],
	caption: 'FF Auth - Users sessions',
	changeLog: false,
})
export class FFAuthUserSession {
	@Fields.string()
	id!: string

	@Fields.date()
	expiresAt!: Date

	@Fields.string()
	userId!: string

	@Relations.toOne<FFAuthUserSession, FFAuthUser>(() => FFAuthUser, 'userId')
	user!: FFAuthUser
}

@ValueListFieldType()
export class FFAuthProvider extends BaseEnum {
	static DEMO = new FFAuthProvider('DEMO', { caption: 'Demo' })
	static PASSWORD = new FFAuthProvider('PASSWORD', { caption: 'Password' })
	static OTP = new FFAuthProvider('OTP', { caption: 'TOTP' })
	static OAUTH = new FFAuthProvider('OAUTH', { caption: 'OAUTH' })

	constructor(id: string, o?: BaseEnumOptions) {
		super(id, {
			...o,
		})
	}
}
