import { repo, type UserInfo } from 'remult'

import { encodeToken } from './helperOslo'
import { getSafeOptions } from './module'

export async function createSession(token: string, userId: string) {
  const sessionId = encodeToken(token)
  const oSafe = getSafeOptions()
  const session = await repo(oSafe.Session).insert({
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + oSafe.session.expiresInMs),
  })

  return session
}

export async function validateSessionToken(token: string): Promise<{
  user: UserInfo | undefined
  freshSession: { sessionToken: string; expiresAt: Date } | undefined
}> {
  const sessionId = encodeToken(token)

  const oSafe = getSafeOptions()

  const sessionDb = await repo(oSafe.Session).findId(sessionId)

  if (!sessionDb) {
    return { user: undefined, freshSession: undefined }
  }

  // TODO TRANSFORM
  const session = {
    //
    id: sessionDb.id,
    userId: sessionDb.userId,
    expiresAt: sessionDb.expiresAt,
  }
  // TODO: Why I can't do 1 query ?!
  const userDb = await repo(oSafe.User).findId(sessionDb.userId)
  if (!userDb) {
    await invalidateSession(sessionId)
    return { user: undefined, freshSession: undefined }
  }
  const user = oSafe.transformDbUserToClientUser(sessionDb, userDb)

  const sessionExpired = Date.now() >= session.expiresAt.getTime()
  if (sessionExpired) {
    await repo(oSafe.Session).delete(sessionId)
    return { user: undefined, freshSession: undefined }
  }

  // To not renew non stop... Let's wait 10% of the session expires
  const renewSession = Date.now() >= session.expiresAt.getTime() - oSafe.session.expiresInMs * 0.9

  if (renewSession) {
    session.expiresAt = new Date(Date.now() + oSafe.session.expiresInMs)
    await repo(oSafe.Session).update(sessionId, { expiresAt: session.expiresAt })
    return { user, freshSession: { sessionToken: token, expiresAt: session.expiresAt } }
  }

  return { user, freshSession: undefined }
}

export async function invalidateSession(sessionId: string) {
  const oSafe = getSafeOptions()
  try {
    // silent error. If the session is already deleted, it will throw an error
    await repo(oSafe.Session).delete(sessionId)
  } catch (error) {}
}
