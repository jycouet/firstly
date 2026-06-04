<script lang="ts">
	import type { CellInput, ManyStrategy } from 'firstly/svelte'
	import { FF_Config, FF_Grid } from 'firstly/svelte'

	import { Task } from '$modules/demo/Task'

	// FF_Grid is the PUBLISHED batteries-included grid (default skin + input — zero setup).
	// App_Group is a BOUTIQUE copy-own shell (this repo's copy lives in src/boutique/grid).
	import App_Group from '../../boutique/grid/App_Group.svelte'
	import Input from '../../boutique/grid/Input.svelte'
	import PriorityBadge from './PriorityBadge.svelte'

	const strategies: ManyStrategy[] = ['paginate', 'listen', 'load']

	// A cells override: `priority` rendered by a component (escape), `done` opts out of sorting.
	const fancyCells: CellInput<Task>[] = [
		'title',
		{ col: 'priority', component: () => PriorityBadge, rowToProps: (r) => ({ value: r.priority }) },
		{ col: 'done', sortable: false },
	]

	let lazyOn = $state(false)
	let groupMode = $state<'edit' | 'readonly'>('edit')
</script>

<!-- the input registry feeds App_Group's form (the published FF_Grid bundles its own default input) -->
<FF_Config cell={{ inputs: { text: Input, number: Input, checkbox: Input } }}>
	<div class="page">
		<header>
			<h1>ff() · cell layer</h1>
			<p>
				firstly publishes <code>FF_Grid</code> — the batteries-included demo grid: default skin + input,
				driven by the entity <code>hub</code>. For a fully-owned grid you copy the boutique
				<code>App_Grid</code> (<code>src/boutique/grid</code>) and style it yourself.
			</p>
		</header>

		<section>
			<div class="head">
				<h2>many — published FF_Grid, zero setup</h2>
				<p>
					<code>{'<FF_Grid entity={Task} />'}</code> — import and go. Columns, the create form (no
					<code>done</code>), delete, and the skin all come for free (from <code>Task.hub</code> + the bundled
					default). Three fetch strategies; add a row and watch each behave.
				</p>
			</div>
			<div class="cols">
				{#each strategies as strategy (strategy)}
					<article>
						<h3>{strategy}</h3>
						<FF_Grid entity={Task} {strategy} pageSize={strategy === 'paginate' ? 2 : 25} />
					</article>
				{/each}
			</div>
		</section>

		<section>
			<div class="head">
				<h2>cells override — a component cell</h2>
				<p>
					Override the hub's <code>cells</code> at the call-site: <code>priority</code> renders via a
					<code>component</code> + <code>rowToProps</code> escape. Columns are sortable by default (flip
					it with <code>defaultSortable</code>); <code>done</code> opts out with
					<code>sortable: false</code>.
				</p>
			</div>
			<article class="card"><FF_Grid entity={Task} cells={fancyCells} strategy="listen" /></article>
		</section>

		<section>
			<div class="head">
				<h2>one — bound record (boutique App_Group)</h2>
				<p>A single record (the latest task) — a group that's a form when editing, values when not.</p>
			</div>
			<article class="card">
				<button
					class="modebtn"
					onclick={() => (groupMode = groupMode === 'edit' ? 'readonly' : 'edit')}
				>
					{groupMode === 'edit' ? 'mode: edit — switch to readonly' : 'mode: readonly — switch to edit'}
				</button>
				<App_Group entity={Task} mode={groupMode} />
			</article>
		</section>

		<section>
			<div class="head">
				<h2>lazy — enabled gate</h2>
				<p>A <code>load</code> grid with <code>enabled</code>: nothing fetches until you turn it on.</p>
			</div>
			<article class="lazy">
				<button class="modebtn" class:on={lazyOn} onclick={() => (lazyOn = !lazyOn)}>
					{lazyOn ? 'enabled: true (fetching)' : 'enabled: false (click to load)'}
				</button>
				<FF_Grid entity={Task} strategy="load" enabled={lazyOn} readonly />
			</article>
		</section>
	</div>
</FF_Config>

<style>
	.page {
		max-width: 1100px;
		display: flex;
		flex-direction: column;
		gap: 40px;
	}
	header h1 {
		font-size: 38px;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0;
		font-family: ui-monospace, 'SF Mono', monospace;
		color: oklch(0.82 0.13 165);
	}
	header p,
	.head p {
		margin: 8px 0 0;
		max-width: 72ch;
		line-height: 1.55;
		opacity: 0.78;
		font-size: 14px;
	}
	section {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.head h2 {
		font-size: 13px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		margin: 0;
		color: oklch(0.82 0.13 165);
		font-family: ui-monospace, monospace;
	}
	.cols {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 18px;
		align-items: start;
	}
	article {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 16px 18px;
		border-radius: 12px;
		border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
		background: color-mix(in srgb, currentColor 3%, transparent);
	}
	article h3 {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
		font-family: ui-monospace, monospace;
		color: oklch(0.7 0.12 250);
	}
	.card {
		max-width: 440px;
	}
	.lazy {
		max-width: 460px;
	}
	.modebtn {
		align-self: start;
		cursor: pointer;
		font: inherit;
		font-size: 13px;
		padding: 7px 14px;
		color: inherit;
		background: color-mix(in srgb, currentColor 9%, transparent);
		border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
		border-radius: 8px;
	}
	.modebtn.on {
		color: oklch(0.82 0.13 165);
		border-color: color-mix(in srgb, oklch(0.82 0.13 165) 50%, transparent);
		background: color-mix(in srgb, oklch(0.82 0.13 165) 14%, transparent);
	}
	code {
		font-size: 0.86em;
		padding: 1px 6px;
		border-radius: 5px;
		background: color-mix(in srgb, currentColor 9%, transparent);
		font-family: ui-monospace, monospace;
	}
</style>
