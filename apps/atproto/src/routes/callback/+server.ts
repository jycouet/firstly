import { redirect } from '@sveltejs/kit'

import { oauthClient, writeAtDid } from '$lib/oauth.server'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, cookies }) => {
	const { session, state } = await oauthClient(url.origin).client.callback(url.searchParams)
	writeAtDid(cookies, session.did)
	redirect(303, `/${state?.startsWith('?') ? state : ''}`)
}
