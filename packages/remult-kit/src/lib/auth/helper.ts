import { remult } from 'remult'

import { lucia } from '.'

export async function createSession(userId: string) {
  const session = await lucia.createSession(userId, {})
  const sessionCookie = lucia.createSessionCookie(session.id)

  remult.context.setCookie(sessionCookie.name, sessionCookie.value, { path: '/' })
}
