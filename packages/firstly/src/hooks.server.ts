import { sequence } from '@sveltejs/kit/hooks'

import { remultKit } from './lib/handle/index.js'
import { remultApi } from './routes/api/[...remult]/firstly.js'

export const handle = sequence(remultKit(remultApi))
