import { createSubscriber } from 'svelte/reactivity'

import { Remult, remult } from 'remult'

// To be done once in the application.
export function initRemultSvelteReactivity() {
	// Auth reactivity (remult.user, remult.authenticated(), ...)
	{
		let update = () => {}
		const s = createSubscriber((u) => {
			update = u
		})
		remult.subscribeAuth({
			reportObserved: () => s(),
			reportChanged: () => update(),
		})
	}

	// Entities reactivity
	{
		Remult.entityRefInit = (x) => {
			let update = () => {}
			const s = createSubscriber((u) => {
				update = u
			})
			x.subscribe({
				reportObserved: () => s(),
				reportChanged: () => update(),
			})
		}
	}
}
