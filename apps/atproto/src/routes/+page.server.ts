import { fail, redirect } from '@sveltejs/kit'

import { errorMessage } from 'firstly'
import { didSupportsSpaces, resolveHandle } from 'firstly/atproto'

import { atConfig } from '$lib/config.server'
import { loginWithToken, oauthClient, oauthSession, writeAtDid } from '$lib/oauth.server'
import { publicDp } from '$lib/provider'

import type { Actions, PageServerLoad } from './$types'

export const load = (async ({ cookies, url }) => {
	const at = await oauthSession(url.origin, cookies)
	const me = at ? await publicDp.describeRepo(at.did).catch(() => ({ handle: at.did })) : null
	const handle = url.searchParams.get('handle') ?? ''
	let did = ''
	let collections: string[] = []
	let error = ''
	if (handle) {
		try {
			did = await resolveHandle(handle, { service: atConfig.pds })
			collections = (await publicDp.describeRepo(did)).collections
		} catch (e) {
			error = errorMessage(e)
		}
	}
	return {
		session: at
			? {
					did: at.did,
					handle: me?.handle ?? at.did,
					spaces: await didSupportsSpaces(at.did, { plcDirectory: atConfig.plc }),
				}
			: null,
		loopbackHint: url.hostname === 'localhost' ? `http://127.0.0.1:${url.port}${url.pathname}` : null,
		tab: url.searchParams.get('tab') ?? 'public',
		pds: atConfig.pds ?? 'public network',
		space: url.searchParams.get('space') ?? '',
		handle,
		did,
		collections,
		collection: url.searchParams.get('collection') ?? '',
		error,
	}
}) satisfies PageServerLoad

export const actions = {
	login: async ({ request, url }) => {
		const form = await request.formData()
		const handle = String(form.get('handle') ?? '').trim()
		const back = String(form.get('back') ?? '')
		if (!handle) return fail(400, { message: 'handle is required' })
		let target: URL
		try {
			// Come back to the same tab / space after the round trip.
			target = await oauthClient(url.origin).client.authorize(handle, { state: back })
		} catch (e) {
			return fail(400, { message: errorMessage(e) })
		}
		redirect(303, target.href)
	},
	token: async ({ request, cookies }) => {
		const form = await request.formData()
		const service = String(form.get('service') ?? '').trim()
		const did = String(form.get('did') ?? '').trim()
		const token = String(form.get('token') ?? '').trim()
		if (!service || !did || !token)
			return fail(400, { message: 'service, did and token are required' })
		loginWithToken(cookies, { service, did, token })
	},
	logout: async ({ cookies, url }) => {
		const at = await oauthSession(url.origin, cookies)
		if (at) await at.signOut().catch(() => {})
		writeAtDid(cookies)
	},
} satisfies Actions
