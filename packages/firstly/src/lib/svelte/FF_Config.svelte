<script lang="ts">
	import type { Snippet } from 'svelte'

	import { setFFConfig, type FF_ConfigValue } from './FF_Config.svelte.js'

	let { children, messages, dialog, toast, cell }: { children: Snippet } & FF_ConfigValue = $props()

	// Hand context a getter over our (reactive) props, not a snapshot - so descendants re-read
	// the latest values and locale-aware message functions resolve fresh on each render.
	setFFConfig(() => ({ messages, dialog, toast, cell }))
</script>

{@render children()}
