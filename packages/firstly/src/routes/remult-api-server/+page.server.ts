import { repo } from 'remult'

import { ApiItem } from '$modules/demo/ApiItem'
import { remultApiServerLoad } from '$lib/svelte/server'

// Server load wrapped so its repo() reads pass the API gate (only `pub` rows),
// instead of the privileged in-process provider that would see all rows.
export const load = remultApiServerLoad(async () => {
	const items = await repo(ApiItem).find()
	return { items: items.map((i) => ({ id: i.id, title: i.title })) }
})
