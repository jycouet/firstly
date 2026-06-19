import type { Component } from 'svelte'

import type { CellComponent } from './cellTypes.js'

// Cache resolved components (and in-flight loads) per thunk, so a lazy `() => import(...)` fires once
// across every row/cell that shares it, and eager `() => Comp` thunks resolve synchronously.
const resolved = new WeakMap<CellComponent, Component>()
const loading = new WeakMap<CellComponent, Promise<Component>>()

/**
 * Resolve a {@link CellComponent} thunk to a Component.
 * - eager `() => Comp` → returns the Component **synchronously** (no render flash)
 * - lazy `() => import('./X.svelte')` → returns a Promise (the module's `default` is unwrapped)
 * Both are cached/deduped per thunk.
 */
export function resolveCellComponent(thunk: CellComponent): Component | Promise<Component> {
	const hit = resolved.get(thunk)
	if (hit) return hit
	const inFlight = loading.get(thunk)
	if (inFlight) return inFlight
	const r = thunk()
	if (r instanceof Promise) {
		const p = r.then((m) => {
			const c = (m && typeof m === 'object' && 'default' in m ? m.default : m) as Component
			resolved.set(thunk, c)
			loading.delete(thunk)
			return c
		})
		loading.set(thunk, p)
		return p
	}
	resolved.set(thunk, r as Component)
	return r as Component
}
