import { Log } from '@kitql/helpers'

import { Mail } from './Mail'

export const key = 'mail'

export const log = new Log(key)

export const mailEntities = {
	Mail,
}
