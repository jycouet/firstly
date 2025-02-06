import { EntityError } from 'remult'
import { cyan, gray, green, italic, yellow } from '@kitql/helpers'

import { mask } from '../../../formats/strings'
import { authModuleRaw } from '../module'

export const checkOAuthConfig = (
  name: string,
  clientId: string,
  secret: string,
  urlForKeys: string,
  withThrow: boolean,
) => {
  if (!clientId || !secret) {
    const msg = `Wrong configuration for ${green(name)} provider.
  ${italic(`Config used ${gray(`(${'.env'} & ${'inferred'}):`)}`)}
  ${yellow('--------------- .env ---------------')}
  ${name.toUpperCase()}_CLIENT_ID = '${mask(clientId)}'
  ${name.toUpperCase()}_CLIENT_SECRET = '${mask(secret)}'
  ${yellow('------------------------------------')}
  Update your configuration to fix this error. 
  ${gray(`By default, we check ${name.toUpperCase()}_CLIENT_ID and ${name.toUpperCase()}_CLIENT_SECRET. 
  But you can also pass your keys as parameters.`)}
  Check ${cyan(urlForKeys)} to generate your keys.
`
    if (withThrow) {
      throw new EntityError({ message: msg })
    } else {
      authModuleRaw.log.error(msg)
    }
  }
}
