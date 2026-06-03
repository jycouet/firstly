import type { Attachment } from 'svelte/attachments'

export type InfiniteScrollOptions = {
	/** Are there more pages to load? */
	hasMore: () => boolean
	/** Is a load already in flight? */
	loading: () => boolean
	/** Load the next page. */
	onMore: () => void
	/** Preload distance below the scroll viewport, in px (default 1200). */
	rootMarginPx?: number
}

/** Nearest scrollable ancestor, or null (the document/window scrolls). */
function scrollParent(el: Element): Element | null {
	let p = el.parentElement
	while (p && p !== document.body) {
		const oy = getComputedStyle(p).overflowY
		if (oy === 'auto' || oy === 'scroll') return p
		p = p.parentElement
	}
	return null
}

/**
 * Infinite-scroll attachment: put it on a bottom sentinel element and it calls
 * `onMore()` when the sentinel nears the scroll container. The observer is rooted
 * on the nearest scrollable ancestor, so it works when the app scrolls inside an
 * inner div (not the window), and a `rootMarginPx` margin streams the next page in
 * just before the sentinel shows. Guarded by `hasMore()`/`loading()`. Because it
 * observes geometry it never misfires on mount: a full first page leaves the
 * sentinel far below the root.
 *
 * Pairs with `ff(E).many(..., 'paginate')`:
 *
 * ```svelte
 * <div {@attach infiniteScroll({
 *   hasMore: () => r.hasNextPage,
 *   loading: () => r.loading.more,
 *   onMore: () => r.more(),
 * })}></div>
 * ```
 */
export function infiniteScroll(opts: InfiniteScrollOptions): Attachment {
	return (node) => {
		const io = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && opts.hasMore() && !opts.loading()) opts.onMore()
			},
			{ root: scrollParent(node), rootMargin: `${opts.rootMarginPx ?? 1200}px 0px` },
		)
		io.observe(node)
		return () => io.disconnect()
	}
}
