import * as arctic from 'arctic'

import { handleAuth } from './handleAuth.js'
import { handleGuard } from './handleGuard.js'

export { auth, authModuleRaw } from './module'
export { linkRoleToUsersFromEnv as initRoleFromEnv } from './helperRole'
export { ff_createSession } from './helperFirstly'
export { deleteSessionTokenCookie } from './helperRemultServer'

export { checkOAuthConfig } from './providers/helperProvider'
export { github } from './providers/github'

export { arctic, handleAuth, handleGuard }
