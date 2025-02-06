import { DEV } from 'esm-env'

import { remult } from 'remult'

import { getSafeOptions } from './module'

export function setSessionTokenCookie(token: string, expiresAt: Date) {
  const oSafe = getSafeOptions()
  remult.context.setCookie(oSafe.session.cookieName, token, {
    expires: expiresAt,
    path: '/',
  })
}

export function deleteSessionTokenCookie() {
  const oSafe = getSafeOptions()
  remult.context.deleteCookie(oSafe.session.cookieName, {
    path: '/',
  })
}

export function setCodeVerifierCookie(codeVerifier: string) {
  remult.context.setCookie('code_verifier', codeVerifier, {
    secure: !DEV,
    path: '/',
    httpOnly: true,
    maxAge: 60 * 10, // 10 min
  })
}

export function setOAuthStateCookie(provider: string, state: string) {
  remult.context.setCookie(`${provider}_oauth_state`, state, {
    path: '/',
    secure: !DEV,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  })
}

export function setRedirectCookie(redirect: string) {
  remult.context.setCookie(`remult_redirect`, redirect, {
    path: '/',
    secure: !DEV,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  })
}
