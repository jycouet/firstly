<script lang="ts">
	import type { PageFlow } from '../EvlogStatsController.js'
	import Section from './_ui/Section.svelte'

	type Props = { data: PageFlow[]; class?: string }
	let { data, class: klass = '' }: Props = $props()

	const max = $derived(Math.max(0, ...data.map((f) => f.count)))
	const fmt = (n: number) => n.toLocaleString()
</script>

<Section title="Navigation flows" hint="from → to, by frequency" class={klass}>
	{#if data.length}
		<div class="flex flex-col">
			{#each data as f (f.fromPage + '->' + f.toPage)}
				<div class="grid grid-cols-[1fr_auto] items-baseline gap-x-3 py-1">
					<div class="flex min-w-0 items-baseline gap-1.5 font-mono text-xs">
						<span class="truncate text-muted-foreground" title={f.fromPage}>{f.fromPage}</span>
						<span class="shrink-0 text-muted-foreground/60">→</span>
						<span class="truncate text-foreground" title={f.toPage}>{f.toPage}</span>
					</div>
					<span class="shrink-0 text-xs font-semibold tabular-nums text-foreground">{fmt(f.count)}</span>
					<div class="col-span-2 mt-1 h-1.5 overflow-hidden rounded-full bg-muted/60">
						<div
							class="h-full rounded-full bg-info"
							style="width:{max > 0 ? Math.max(3, Math.round((f.count / max) * 100)) : 0}%"
						></div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="py-8 text-center text-xs text-muted-foreground">No navigation flows yet.</p>
	{/if}
</Section>
