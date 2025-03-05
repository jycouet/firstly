import { createSession } from './helperDb'
import { generateToken } from './helperOslo'
import { setSessionTokenCookie } from './helperRemultServer'

export const ff_createSession = async (userId: string) => {
  const token = generateToken()
  const session = await createSession(token, userId)
  setSessionTokenCookie(token, session.expiresAt)
}
