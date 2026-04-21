<script lang="ts">
	import { remult } from 'remult'

	import '../app.css'

	import { initRemultSvelteReactivity } from 'firstly/svelte'

	import type { LayoutData } from './$types'

	interface Props {
		data: LayoutData
		children?: import('svelte').Snippet
	}

	let { children, data }: Props = $props()
	remult.user = data.user

	initRemultSvelteReactivity()
</script>

<svelte:head>
	<title>Firstly</title>
</svelte:head>

{@render children?.()}
