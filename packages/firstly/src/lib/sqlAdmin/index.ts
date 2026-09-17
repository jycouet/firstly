import { Log } from '@kitql/helpers'

export { Roles_SqlAdmin } from './Roles_SqlAdmin'
export { SqlAdminController } from './SqlAdminController'
export { SqlTokenController, type SqlResult, type SqlTokensOptions } from './SqlTokenController'
export {
	SQL_TOKEN_CAPS,
	SQL_TOKEN_TTLS,
	SqlToken,
	SqlTokenCall,
	type SqlTokenCap,
	type SqlTokenTtl,
} from './sqlTokenEntities'
export { default as SqlAdmin } from './ui/SqlAdmin.svelte'
export { default as SqlTokens } from './ui/SqlTokens.svelte'

export const key = 'sqlAdmin'

export const log = new Log(key)
