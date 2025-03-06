import * as arctic from 'arctic'

import { handleAuth } from './handleAuth.js'
import { handleGuard } from './handleGuard.js'

export { auth, authModuleRaw } from './module'

export { checkOAuthConfig } from './providers/helperProvider'
export { github } from './providers/github'

export { arctic, handleAuth, handleGuard }
