import { sequence } from '@sveltejs/kit/hooks'

import { handleAuth } from './boutique/auth/server/handle'
import { api as handleRemult } from './server/api'

export const handle = sequence(handleAuth, handleRemult)
