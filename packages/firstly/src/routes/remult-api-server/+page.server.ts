import { loadRepo } from 'firstly/svelte'

import { ApiItem } from '$modules/demo/ApiItem'

import type { PageServerLoad } from './$types'

// Server load reading through the API gate (only `pub` rows), instead of the
// privileged in-process provider that would see all rows. SvelteKit dispatches
// same-origin server fetch in-process (no network) with cookies forwarded.
export const load = loadRepo(async (repoClient) => {
	const items = await repoClient(ApiItem).find()
	return { items: items.map((i) => ({ id: i.id, title: i.title })) }
}) satisfies PageServerLoad
