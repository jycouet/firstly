import type { RequestEvent } from '@sveltejs/kit'

import { remult } from 'remult'

declare module 'remult' {
	export interface RemultContext {
		request?: RequestEvent
	}
}

type AuthLocals = { authSetCookies?: string[] }

// better-auth only re-issues the session cookie (sliding Max-Age) inside its
// endpoint execution. Server-side api.getSession() discards that Set-Cookie,
// so we capture it here (initRequest) and handleAuth forwards it.
export async function getSessionAndSlideCookie<
	TApi extends {
		getSession: (ctx: { headers: Headers; returnHeaders?: boolean }) => Promise<unknown>
	},
>(auth: { api: TApi }) {
	const { headers, response } = (await auth.api.getSession({
		headers: new Headers(remult.context.headers?.getAll()),
		returnHeaders: true,
	})) as { headers: Headers; response: Awaited<ReturnType<TApi['getSession']>> }

	const setCookies = headers.getSetCookie()
	if (setCookies.length > 0) {
		const locals = remult.context.request?.locals as AuthLocals | undefined
		if (locals) locals.authSetCookies = setCookies
	}

	return response
}

export function forwardAuthSetCookies(event: RequestEvent, response: Response) {
	const setCookies = (event.locals as AuthLocals).authSetCookies
	if (setCookies?.length && !response.headers.has('set-cookie')) {
		for (const cookie of setCookies) {
			response.headers.append('set-cookie', cookie)
		}
	}
	return response
}
