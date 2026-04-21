<script lang="ts">
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

<section class={`card bg-base-100 shadow ${widthClass} ${className}`}>
	<div class="card-body">
		<header class="flex items-baseline justify-between gap-2">
			<div>
				<h2 class="card-title">{title}</h2>
				{#if subtitle}
					<p class="text-sm opacity-70">{subtitle}</p>
				{/if}
			</div>
			{#if status}
				<span class="badge badge-sm badge-success">{status}</span>
			{/if}
		</header>
		<div class="flex flex-col gap-2">
			{@render children?.()}
		</div>
	</div>
</section>
