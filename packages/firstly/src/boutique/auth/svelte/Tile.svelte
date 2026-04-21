<script lang="ts">
	import * as Card from '$lib/svelte/ui/card'
	import { Badge } from '$lib/svelte/ui/badge'
	import { cn } from '$lib/utils'

	interface Props {
		title: string
		subtitle?: string
		status?: string
		className?: string
		width?: 'full' | 'half' | 'third'
		children?: import('svelte').Snippet
	}

	let { title, subtitle = '', status = '', className = '', width = 'full', children }: Props = $props()

	const widthClass = {
		full: 'col-span-12',
		half: 'col-span-12 md:col-span-6',
		third: 'col-span-12 md:col-span-4',
	}[width]
</script>

<Card.Root class={cn(widthClass, className)}>
	<Card.Header>
		<div class="flex items-start justify-between gap-2">
			<div class="flex flex-col gap-1">
				<Card.Title>{title}</Card.Title>
				{#if subtitle}
					<Card.Description>{subtitle}</Card.Description>
				{/if}
			</div>
			{#if status}
				<Badge variant="success">{status}</Badge>
			{/if}
		</div>
	</Card.Header>
	<Card.Content class="flex flex-col gap-3">
		{@render children?.()}
	</Card.Content>
</Card.Root>
