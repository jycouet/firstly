<script lang="ts" module>
	// Plain promise memo, not UI state.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const cache = new Map<string, Promise<{ did: string; handle: string; spaces: boolean }>>()
	/** Resolve a did or handle through the demo endpoint, once per page. */
	export const identity = (id: string) => {
		let p = cache.get(id)
		if (!p) {
			p = fetch(`/handle?id=${encodeURIComponent(id)}`).then(async (r) => {
				const j = await r.json()
				if (!r.ok) throw new Error(j.error)
				return j as { did: string; handle: string; spaces: boolean }
			})
			p.catch(() => cache.delete(id))
			cache.set(id, p)
		}
		return p
	}
</script>

<script lang="ts">
	let { did = '', me = undefined }: { did?: string; me?: string } = $props()
	let handle = $state('')
	let spaces = $state(true)
	$effect(() => {
		identity(did)
			.then((i) => {
				handle = i.handle
				spaces = i.spaces
			})
			.catch(() => {})
	})
</script>

<span class="text-muted-foreground text-xs" title={did}>
	@{handle || did.slice(0, 16)}{#if did === me}<span class="opacity-60"> (you)</span>{/if}
	{#if !spaces}<span
			class="text-destructive"
			title="This PDS has no spaces support: cannot read or write here">no spaces</span
		>{/if}
</span>
