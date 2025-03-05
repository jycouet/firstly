import * as arctic from 'arctic'
import { handleAuth } from './handleAuth.js'

export { auth, authModuleRaw } from './module'

export { checkOAuthConfig } from './providers/helperProvider'
export { github } from './providers/github'

export { arctic, handleAuth }
