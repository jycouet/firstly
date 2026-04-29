import { sequence } from '@sveltejs/kit/hooks'

import { evlogHandle } from 'firstly/evlog/server'

import { api as handleRemult } from './server/api'

export const handle = sequence(evlogHandle(), handleRemult)
