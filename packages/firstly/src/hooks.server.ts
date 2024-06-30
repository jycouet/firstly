import { sequence } from '@sveltejs/kit/hooks'

import { firstly } from './lib/handle/index.js'
import { remultApi } from './routes/api/[...remult]/firstly.js'

export const handle = sequence(firstly(remultApi))
