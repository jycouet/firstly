import { Log } from '@kitql/helpers'

import { Auth } from './Auth'
import { FFAuthAccount, FFAuthProvider, FFAuthUser, FFAuthUserSession } from './Entities'

export const logAuth = new Log('firstly | auth')

export { FF_Auth_Role } from './Entities'
export { Auth }
export { FFAuthUser, FFAuthAccount, FFAuthProvider, FFAuthUserSession }
