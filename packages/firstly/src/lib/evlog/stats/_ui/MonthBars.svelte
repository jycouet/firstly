<script lang="ts">
	type Segment = { name: string; value: number; class: string }
	type Bar = { label: string; total: number; segments: Segment[] }
	type Props = {
		bars: Bar[]
		legend?: { name: string; class: string }[]
		fmt?: (n: number) => string
	}
	let { bars, legend, fmt = (n) => n.toLocaleString() }: Props = $props()

	const maxTotal = $derived(Math.max(1, ...bars.map((b) => b.total)))
</script>

<div class="flex flex-col gap-2">
	{#if legend}
		<div class="flex flex-wrap gap-x-3 gap-y-1">
			{#each legend as l (l.name)}
				<span class="flex items-center gap-1.5 text-[10px] text-muted-foreground">
					<span class="size-2 rounded-sm {l.class}"></span>{l.name}
				</span>
			{/each}
		</div>
	{/if}

	<div class="flex h-36 items-end gap-1">
		{#each bars as bar (bar.label)}
			<div class="group flex h-full flex-1 flex-col justify-end" title="{bar.label}: {fmt(bar.total)}">
				<div class="flex flex-col-reverse overflow-hidden rounded-t-sm">
					{#each bar.segments as seg (seg.name)}
						{#if seg.value > 0}
							<div
								class="{seg.class} min-h-px transition-none"
								style="height:{(seg.value / maxTotal) * 9}rem"
								title="{seg.name}: {fmt(seg.value)}"
							></div>
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="flex gap-1">
		{#each bars as bar (bar.label)}
			<div class="flex-1 truncate text-center text-[10px] text-muted-foreground">{bar.label}</div>
		{/each}
	</div>
</div>
