<script lang="ts">
	import type { Snippet } from 'svelte'

	type Props = {
		title: string
		hint?: string
		/** Extra classes on the <section> (grid spans, etc.). */
		class?: string
		/** Right side of the header (a total, a toggle, ...). */
		aside?: Snippet
		children: Snippet
		/** Drop the inner padding (for full-bleed tables). */
		flush?: boolean
	}
	let { title, hint, class: klass = '', aside, children, flush = false }: Props = $props()
</script>

<section class="flex min-w-0 flex-col rounded-xl border border-border bg-card {klass}">
	<header class="flex items-baseline justify-between gap-3 px-4 pt-3.5 pb-2.5">
		<div class="min-w-0">
			<h3 class="truncate text-sm font-semibold tracking-tight text-foreground">{title}</h3>
			{#if hint}<p class="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>{/if}
		</div>
		{#if aside}<div class="shrink-0 text-xs text-muted-foreground">{@render aside()}</div>{/if}
	</header>
	<div class="flex-1 {flush ? '' : 'px-4 pb-4'}">
		{@render children()}
	</div>
</section>
