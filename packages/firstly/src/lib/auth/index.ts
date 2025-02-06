import { Log } from '@kitql/helpers'

import { AuthController } from './AuthController'
import { FFAuthAccount, FFAuthProvider, FFAuthUser, FFAuthUserSession } from './Entities'

export const logAuth = new Log('firstly | auth')

export { FF_Role_Auth } from './Entities'
export { AuthController }
export { FFAuthUser, FFAuthAccount, FFAuthProvider, FFAuthUserSession }
