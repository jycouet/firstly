import { ApiItem } from '$modules/demo/ApiItem'
import { loadRepo } from '$lib/svelte'

// Universal load: repoClient reads through the API on SSR and CSR.
// Only `pub` rows come back (the private one is filtered by apiPrefilter).
export const load = loadRepo(async (repoClient) => {
	const items = await repoClient(ApiItem).find()
	return {
		items: items.map((i) => ({ id: i.id, title: i.title })),
	}
})
