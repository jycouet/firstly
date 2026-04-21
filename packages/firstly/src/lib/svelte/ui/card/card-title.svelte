<script lang="ts">
	import type { WithElementRef } from 'bits-ui'
	import type { HTMLAttributes } from 'svelte/elements'

	import { cn } from '$lib/utils'

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLHeadingElement>> = $props()
</script>

<h3 bind:this={ref} class={cn('text-lg leading-none font-semibold', className)} {...restProps}>
	{@render children?.()}
</h3>
