<script lang="ts">
	import type { ManyStrategy } from 'firstly/svelte'
	import { FF_Config } from 'firstly/svelte'

	import { Task } from '$modules/demo/Task'

	// The grid/group shells are BOUTIQUE (copy-own). This page composes them over the published
	// primitives + registers the app's input.
	import FF_Grid from '../../boutique/grid/FF_Grid.svelte'
	import FF_Group from '../../boutique/grid/FF_Group.svelte'
	import Input from '../../boutique/grid/Input.svelte'

	const fields = ['title', 'priority', 'done'] as const
	// `done` is server-locked on insert (allowApiUpdate) — name it in edit, but not create.
	const createFields = ['title', 'priority'] as const
	const strategies: ManyStrategy[] = ['paginate', 'listen', 'load']

	let lazyOn = $state(false)
	let groupMode = $state<'edit' | 'readonly'>('edit')
</script>

<FF_Config cell={{ inputs: { text: Input, number: Input, checkbox: Input } }}>
	<div class="page">
		<header>
			<h1>ff() · cell layer</h1>
			<p>
				firstly ships the headless primitives — <code>ff()</code>, <code>buildCells</code>,
				<code>FF_Cell</code> (% + metadata), and the <code>FF_Config.cell</code> input registry. The
				grid &amp; group below are <strong>boutique</strong> (copy-own from
				<code>src/boutique/grid</code>): opinionated shells with edit + delete in a dialog.
			</p>
		</header>

		<section>
			<div class="head">
				<h2>many — three fetch strategies</h2>
				<p>
					Same boutique <code>FF_Grid</code>, three strategies. <code>+ New</code> / per-row
					<code>Edit</code> open a dialog (Save / Delete inside). Fields are named per context:
					<code>done</code> shows in edit but not create (and is server-locked on insert via
					<code>allowApiUpdate</code>). Add a row and watch each behave.
				</p>
			</div>
			<div class="cols">
				{#each strategies as strategy (strategy)}
					<article>
						<h3>{strategy}</h3>
						<FF_Grid
							entity={Task}
							selected={[...fields]}
							createFields={[...createFields]}
							{strategy}
							pageSize={strategy === 'paginate' ? 2 : 25}
						/>
					</article>
				{/each}
			</div>
		</section>

		<section>
			<div class="head">
				<h2>one — bound record (FF_Group)</h2>
				<p>A single record (the latest task) — a group that's a form when editing, values when not.</p>
			</div>
			<article class="card">
				<button
					class="modebtn"
					onclick={() => (groupMode = groupMode === 'edit' ? 'readonly' : 'edit')}
				>
					{groupMode === 'edit' ? 'mode: edit — switch to readonly' : 'mode: readonly — switch to edit'}
				</button>
				<FF_Group entity={Task} selected={[...fields]} mode={groupMode} />
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
				<FF_Grid entity={Task} selected={[...fields]} strategy="load" enabled={lazyOn} />
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

	/* ===== skin the headless boutique markup (data-ff-* hooks). :global reaches the dialog portal. ===== */

	/* grid table */
	:global([data-ff-grid] table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
	}
	:global([data-ff-grid] :is(th, td)) {
		padding: 6px 9px;
		border-bottom: 1px solid color-mix(in srgb, currentColor 13%, transparent);
		text-align: left;
		white-space: nowrap;
	}
	/* first column absorbs the slack so the actions column sits at the far right */
	:global([data-ff-grid] th:first-child),
	:global([data-ff-grid] td:first-child) {
		width: 100%;
	}
	:global([data-ff-grid] th) {
		font-weight: 600;
		cursor: pointer;
		user-select: none;
	}
	:global([data-ff-grid] tbody tr:hover) {
		background: color-mix(in srgb, currentColor 6%, transparent);
	}

	/* toolbar: +New (ghost, left) … count (right) */
	:global([data-ff-grid-toolbar]) {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 8px;
	}
	:global([data-ff-grid-count]) {
		margin-left: auto;
		font-size: 15px;
		opacity: 0.75;
		font-variant-numeric: tabular-nums;
	}
	:global([data-ff-grid-empty]) {
		opacity: 0.6;
		font-size: 14px;
	}

	/* actions column: right-aligned, ghost icon buttons (edit + new) */
	:global([data-ff-grid-actions]) {
		text-align: right;
	}
	:global([data-ff-grid] [data-ff-grid-edit]),
	:global([data-ff-grid] [data-ff-grid-new]) {
		background: transparent;
		border-color: transparent;
		padding: 3px 5px;
		opacity: 0.6;
	}
	:global([data-ff-grid] [data-ff-grid-edit]:hover),
	:global([data-ff-grid] [data-ff-grid-new]:hover) {
		background: color-mix(in srgb, currentColor 12%, transparent);
		opacity: 1;
	}

	/* "More" — centered with top breathing room */
	:global([data-ff-grid] [data-ff-grid-more]) {
		display: flex;
		margin: 12px auto 0;
	}

	/* loading skeleton — fixed height so rows don't shift when data lands */
	:global([data-ff-grid] [data-sk]) {
		display: inline-block;
		width: 70%;
		height: 1.05em;
		border-radius: 4px;
		background: color-mix(in srgb, currentColor 14%, transparent);
		animation: ff-sk 1.2s ease-in-out infinite;
	}
	:global([data-ff-grid] [data-sk-btn]) {
		width: 1.4em;
	}
	@keyframes -global-ff-sk {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 0.85;
		}
	}

	/* buttons (grid + form/dialog) */
	:global([data-ff-grid] button),
	:global([data-ff-form] button),
	:global([data-ff-form-new]) {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font: inherit;
		cursor: pointer;
		padding: 5px 11px;
		color: inherit;
		background: color-mix(in srgb, currentColor 8%, transparent);
		border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
		border-radius: 7px;
	}
	:global([data-ff-grid] button:disabled),
	:global([data-ff-form] button:disabled) {
		opacity: 0.45;
		cursor: not-allowed;
	}
	:global([data-ff-grid] button:hover),
	:global([data-ff-form] button:hover) {
		background: color-mix(in srgb, currentColor 15%, transparent);
	}

	/* form/group (FF_Group + the FF_Grid dialog both render these) */
	:global([data-ff-form]),
	:global([data-ff-group]) {
		display: block;
		min-width: 280px;
	}
	:global([data-ff-form-actions]) {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		margin-top: 4px;
		/* reserve the button-row height so readonly (empty actions) matches edit */
		min-height: calc(1.2em + 14px);
	}
	/* readonly value — same box metrics as an input so switching mode doesn't shift height */
	:global([data-ff-readonly]) {
		display: block;
		box-sizing: border-box;
		padding: 5px 8px;
		border: 1px solid transparent;
		min-height: calc(1.2em + 12px);
	}
	/* a checkbox is shorter than a text input — match that height in readonly too */
	:global([data-ff-readonly][data-input-type='checkbox']) {
		min-height: 0;
		padding: 2px 8px;
	}
	:global([data-ff-form-actions] [data-primary]) {
		margin-left: auto;
		font-weight: 600;
		color: #06241c;
		background: oklch(0.82 0.13 165);
		border-color: transparent;
	}
	:global([data-ff-form-actions] [data-primary]:hover) {
		background: oklch(0.87 0.14 165);
	}
	:global([data-ff-form-actions] [data-danger]) {
		color: var(--color-error, #dc2626);
		border-color: color-mix(in srgb, var(--color-error, #dc2626) 45%, transparent);
	}
	:global([data-ff-form-error]) {
		color: var(--color-error, #dc2626);
		font-size: 13px;
		margin: 4px 0 0;
	}
</style>
