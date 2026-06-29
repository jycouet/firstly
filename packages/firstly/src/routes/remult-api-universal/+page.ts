import { remult, repo } from 'remult'

import { ApiItem } from '$modules/demo/ApiItem'
import { remultApiUniversalLoad } from '$lib/svelte'

// Universal load: plain global repo(), gated by the API on SSR and CSR.
// Only `pub` rows come back (the private one is filtered by apiPrefilter).
export const load = remultApiUniversalLoad(async () => {
	const items = await repo(ApiItem).find()
	return {
		provider: remult.dataProvider?.constructor?.name ?? '?',
		items: items.map((i) => ({ id: i.id, title: i.title })),
	}
})
