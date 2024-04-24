import { Entity, Fields, Relations, Validators, ValueListFieldType } from 'remult'

import { KitBaseEnum, KitRole } from '../'
import type { KitBaseEnumOptions } from '../'

export const KitAuthRole = {
  Admin: 'KitAuthAdmin',
} as const

@Entity('kit_auth_user', {
  allowApiCrud: [KitAuthRole.Admin, KitRole.Admin],
  dbName: 'auth.kit_auth_user',
})
export class KitAuthUser {
  @Fields.cuid()
  id!: string

  @Fields.createdAt()
  createdAt!: Date

  @Fields.updatedAt()
  updatedAt!: Date

  // @Fields.string<KitAuthUser>({
  @Fields.string({
    validate: [
      // REMULT P3 Error: Type 'FieldValidator<unknown, unknown>' is not assignable to type 'FieldValidator<any, unknown>'
      // @ts-ignore
      Validators.unique(),
      (e) => {
        if (e.name.length < 2) throw 'Must be at least 2 characters long'
      },
    ],
  })
  name!: string

  @Fields.object<KitAuthUser, string[]>({
    valueConverter: {
      toDb: (x) => (x ? x.join(',') : undefined),
      fromDb: (x) => (x ? x.split(',') : undefined),
    },
  })
  roles: string[] = []

  @Relations.toMany<KitAuthUser, KitAuthAccount>(() => KitAuthAccount, 'userId')
  accounts!: KitAuthAccount[]

  @Relations.toMany<KitAuthUser, KitAuthUserSession>(() => KitAuthUserSession, 'userId')
  sessions!: KitAuthUserSession[]
}

@Entity<KitAuthAccount>('kit_auth_account', {
  allowApiCrud: [KitAuthRole.Admin, KitRole.Admin],
  dbName: 'auth.kit_auth_account',
  id: { provider: true, userId: true },
})
export class KitAuthAccount {
  @Fields.createdAt()
  createdAt!: Date

  @Fields.updatedAt()
  updatedAt!: Date

  @Fields.string()
  userId!: string

  @Relations.toOne<KitAuthAccount, KitAuthUser>(() => KitAuthUser, 'userId')
  user!: KitAuthUser

  @Fields.string()
  provider = AuthProvider.PASSWORD.id

  @Fields.string()
  providerUserId = ''

  @Fields.string({ includeInApi: false, allowNull: true })
  hashPassword?: string

  @Fields.string({ includeInApi: false, allowNull: true })
  token?: string

  @Fields.date({ includeInApi: false, allowNull: true })
  expiresAt?: Date
}

@Entity('kit_auth_session', {
  allowApiCrud: [KitAuthRole.Admin, KitRole.Admin],
  dbName: 'auth.kit_auth_session',
})
export class KitAuthUserSession {
  @Fields.cuid()
  id!: string

  @Fields.date()
  expiresAt!: Date

  @Fields.string()
  userId!: string

  @Relations.toOne<KitAuthUserSession, KitAuthUser>(() => KitAuthUser, 'userId')
  user!: KitAuthUser
}

@ValueListFieldType()
export class AuthProvider extends KitBaseEnum {
  static DEMO = new AuthProvider('DEMO', { caption: 'Demo' })
  static PASSWORD = new AuthProvider('PASSWORD', { caption: 'Password' })
  static OTP = new AuthProvider('OTP', { caption: 'TOTP' })
  static OAUTH = new AuthProvider('OAUTH', { caption: 'OAUTH' })

  constructor(id: string, o?: KitBaseEnumOptions) {
    super(id, {
      ...o,
    })
  }
}
