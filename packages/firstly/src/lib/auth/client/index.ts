import { Log } from '@kitql/helpers'

import { Auth } from './Auth'
import { FFAuthAccount, FFAuthProvider, FFAuthUser, FFAuthUserSession } from './Entities'

export const logAuth = new Log('firstly | auth')

export { FF_Role_Auth } from './Entities'
export { Auth }
export { FFAuthUser, FFAuthAccount, FFAuthProvider, FFAuthUserSession }
