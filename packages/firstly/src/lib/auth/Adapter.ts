import type { Adapter, DatabaseSession, DatabaseUser } from 'lucia'

import { remult } from 'remult'

import { getSafeOptions } from './index.js'

export class RemultLuciaAdapter implements Adapter {
  async getSessionAndUser(
    sessionId: string,
  ): Promise<[session: DatabaseSession | null, user: DatabaseUser | null]> {
    const oSafe = getSafeOptions()
    const session = await remult.repo(oSafe.Session).findId(sessionId)

    if (session) {
      const user = await remult.repo(oSafe.User).findId(session.userId)

      return [
        { ...session, attributes: {} },
        {
          ...user,
          attributes: {
            ...user,
            session: { id: session.id, expiresAt: session.expiresAt },
          },
        },
      ]
    }
    return [null, null]
  }
  async getUserSessions(userId: string): Promise<DatabaseSession[]> {
    const oSafe = getSafeOptions()
    return (await remult.repo(oSafe.Session).find({ where: { userId } })).map((s) => {
      return { ...s, attributes: {} }
    })
  }
  async setSession(session: DatabaseSession): Promise<void> {
    const oSafe = getSafeOptions()
    await remult.repo(oSafe.Session).insert(session)
  }
  async updateSessionExpiration(sessionId: string, expiresAt: Date): Promise<void> {
    const oSafe = getSafeOptions()
    await remult.repo(oSafe.Session).update(sessionId, { expiresAt })
  }
  async deleteSession(sessionId: string): Promise<void> {
    const oSafe = getSafeOptions()
    await remult.repo(oSafe.Session).delete(sessionId)
  }
  async deleteUserSessions(userId: string): Promise<void> {
    const oSafe = getSafeOptions()
    const all = await remult.repo(oSafe.Session).find({ where: { userId } })
    for (const s of all) {
      await remult.repo(oSafe.Session).delete(s)
    }
  }
  async deleteExpiredSessions(): Promise<void> {
    const oSafe = getSafeOptions()
    const all = await remult.repo(oSafe.Session).find({ where: { expiresAt: { $lt: new Date() } } })
    for (const s of all) {
      await remult.repo(oSafe.Session).delete(s)
    }
  }
}
