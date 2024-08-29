import type { Session } from 'lucia'

import { remult } from 'remult'

import { lucia } from '.'

/**
 * Create or extend a session for a user.
 * If you pass a session, it will extend it.
 */
export async function createOrExtendSession(userId: string, session?: Session) {
  const sessionToUser = session ? session : await lucia.createSession(userId, {})
  const sessionCookie = lucia.createSessionCookie(sessionToUser.id)

  remult.context.setCookie(sessionCookie.name, sessionCookie.value, {
    path: '/',
    ...sessionCookie.attributes,
  })
}
