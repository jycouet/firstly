<script lang="ts">
	import { onMount } from 'svelte'
	import { Toaster, type ToasterProps } from 'svelte-sonner'

	import { resolveMessage } from '../core/FF_Validators.js'
	import { ffConfig } from './FF_Config.svelte.js'
	import { _setToastTitleResolver } from './toast.js'

	// Explicit props win over <FF_Config> toast over firstly defaults.
	let props: Partial<ToasterProps> = $props()
	const cfg = ffConfig()

	// Bridge <FF_Config>'s per-kind titles into the (module-level) `toast` fn. Client-only:
	// toasts never fire during SSR, so this keeps no request-shared state on the server. The
	// closure re-reads config at toast time, so locale-aware message functions resolve fresh.
	onMount(() => {
		_setToastTitleResolver((kind) => resolveMessage(cfg.messages.toast[kind]))
	})
</script>

<!-- Precedence (later wins): firstly defaults → <FF_Config> toast → explicit props. -->
<Toaster richColors position="top-right" {...cfg.toast} {...props} />
