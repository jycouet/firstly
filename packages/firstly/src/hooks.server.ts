import { sequence } from '@sveltejs/kit/hooks'

import { ev } from './server/_evlog'
import { api as handleRemult } from './server/api'

export const handle = sequence(ev.handle, handleRemult)
