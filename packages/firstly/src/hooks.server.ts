import { sequence } from '@sveltejs/kit/hooks'

import { handleAuth } from './lib/auth/server/handleAuth'
import { api as handleRemult } from './server/api'

export const handle = sequence(handleRemult, handleAuth)
