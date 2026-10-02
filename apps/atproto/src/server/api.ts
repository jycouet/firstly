import type { UserInfo } from 'remult'
import { remultApi } from 'remult/remult-sveltekit'
import { AtAny, AtSpace, AtSpaceMember, Roles_Atproto } from 'firstly/atproto'

import { FfNote, FfReview, GetairNote } from '$lib/entities'
import { oauthSession } from '$lib/oauth.server'

import '$lib/provider'

export const api = remultApi({
	entities: [FfNote, FfReview, GetairNote, AtAny, AtSpace, AtSpaceMember],
	admin: true,
	initRequest: async (event, { remult }) => {
		remult.context.at = await oauthSession(event.url.origin, event.cookies)
	},
	// The OAuth session doubles as the user: the PDS enforces ownership, the role only gates the API.
	getUser: async (event) => {
		const at = await oauthSession(event.url.origin, event.cookies)
		if (!at) return undefined
		return {
			id: at.did,
			name: at.did,
			roles: [Roles_Atproto.Atproto_Test, Roles_Atproto.Atproto_Admin],
		} as UserInfo
	},
})
