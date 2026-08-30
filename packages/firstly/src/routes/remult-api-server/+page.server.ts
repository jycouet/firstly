import { ApiItem } from '$modules/demo/ApiItem'
import { repoFetch } from '$lib/svelte'
import type { PageServerLoad } from './$types'

// Server load reading through the API gate (only `pub` rows), instead of the
// privileged in-process provider that would see all rows. SvelteKit dispatches
// same-origin server fetch in-process (no network) with cookies forwarded.
export const load = (async (event) => {
	const repoClient = repoFetch(event.fetch)
	const items = await repoClient(ApiItem).find()
	return { items: items.map((i) => ({ id: i.id, title: i.title })) }
}) satisfies PageServerLoad
