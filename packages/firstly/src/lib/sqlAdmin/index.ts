import { Log } from '@kitql/helpers'

export { Roles_SqlAdmin } from './Roles_SqlAdmin'
export { SqlAdminController, type SqlResult, type SqlTokensOptions } from './SqlAdminController'
export { SqlDriftController, type SqlDriftFlag } from './SqlDriftController'
export {
	SQL_CAPABILITIES,
	SQL_TOKEN_TTLS,
	SqlToken,
	SqlTokenCall,
	type SqlCapability,
	type SqlTokenTtl,
} from './sqlTokenEntities'
export { default as SqlAdmin } from './ui/SqlAdmin.svelte'
export { default as SqlDrift } from './ui/SqlDrift.svelte'
export { default as SqlTokens } from './ui/SqlTokens.svelte'

export const key = 'sqlAdmin'

export const log = new Log(key)
