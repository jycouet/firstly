import { Log } from '@kitql/helpers'

export { Roles_SqlAdmin } from './Roles_SqlAdmin'
export { SqlAdminController } from './SqlAdminController'
export { default as SqlAdmin } from './ui/SqlAdmin.svelte'

export const key = 'sqlAdmin'

export const log = new Log(key)
