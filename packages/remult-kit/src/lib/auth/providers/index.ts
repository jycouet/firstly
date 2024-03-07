import { gray, green, italic, yellow } from '@kitql/helpers'

import { mask } from '$lib/formats/strings'

import { logAuth } from '..'

export const checkOAuthConfig = (
	name: string,
	clientId: string,
	secret: string,
	withThrow: boolean,
) => {
	if (!clientId || !secret) {
		const msg = `Wrong configuration for ${name} provider.
	${italic(`Config used (${green('.env')} & ${green('inferred')}):`)}
${yellow('--------------- .env ---------------')}
${name.toUpperCase()}_CLIENT_ID = '${mask(clientId)}'
${name.toUpperCase()}_CLIENT_SECRET = '${mask(secret)}'
${yellow('------------------------------------')}
Update your configuration to fix this error. 
${gray(`By default, we check ${name.toUpperCase()}_CLIENT_ID and ${name.toUpperCase()}_CLIENT_SECRET. 
But you can also pass your keys as parameters.`)}
`
		if (withThrow) {
			throw new Error(msg)
		} else {
			logAuth.error(msg)
		}
	}
}

export { github } from './github'
export { strava } from './strava'
