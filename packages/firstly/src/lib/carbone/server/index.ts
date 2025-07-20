import { Module } from 'remult/server'

import { carbonEntities, key, log } from '..'
import { CarboneController } from '../CarboneController'
import { CarboneServer } from './CarboneServer'

export const carbone = (config: {
	CARBONE_API_KEY?: string
	api_url?: string
	api_version?: '5'
	test?: boolean
}) => {
	return new Module({
		key,
		entities: Object.values(carbonEntities),
		controllers: [CarboneController],
		initApi: async () => {
			if (config.CARBONE_API_KEY === undefined) {
				log.error('CARBONE_API_KEY is required')
			} else {
				CarboneController.server = new CarboneServer({
					...config,
					test: config.test === undefined ? config.CARBONE_API_KEY.startsWith('test') : config.test,
				})
				log.success('initialized')
			}
		},
	})
}
