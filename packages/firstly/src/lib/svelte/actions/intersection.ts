import { getScrollParent } from '@layerstack/utils'
import type { Action } from 'svelte/action'

interface Attributes {
	onintersecting: (e: CustomEvent<IntersectionObserverEntry>) => void
}

// to bring back to https://github.com/techniq/layerstack/blob/main/packages/svelte-actions/src/lib/observer.ts to have correct typing in Svelte 5
export const intersection: Action<HTMLElement, IntersectionObserverInit | undefined, Attributes> = (
	node,
	options = {},
) => {
	const scrollParent = getScrollParent(node)
	// Use viewport (null) if scrollParent = `<body>`
	const root = scrollParent === document.body ? null : scrollParent

	const observer = new IntersectionObserver(
		(entries, observer) => {
			const entry = entries[0]
			node.dispatchEvent(new CustomEvent('intersecting', { detail: entry }))
		},
		{ root, ...options },
	)
	observer.observe(node)

	return {
		destroy() {
			observer.disconnect()
		},
	}
}
