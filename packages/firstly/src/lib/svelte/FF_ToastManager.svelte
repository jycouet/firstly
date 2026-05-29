<script lang="ts">
	import { Toaster, type ToasterProps } from 'svelte-sonner'

	import { ffConfig } from './FF_Config.svelte.js'

	// Explicit props win over <FF_Config> toast over firstly defaults.
	let props: Partial<ToasterProps> = $props()
	const cfg = ffConfig()
</script>

<!-- Precedence (later wins): firstly defaults → <FF_Config> toast → explicit props. -->
<Toaster richColors position="top-right" {...cfg.toast} {...props} />
