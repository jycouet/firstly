<script lang="ts">
	import type { ManyStrategy } from 'firstly/svelte'
	import { DemoForm, DemoGrid } from 'firstly/svelte'

	import { Task } from '$modules/demo/Task'

	const fields = ['title'] as const
	const strategies: ManyStrategy[] = ['paginate', 'listen', 'load']

	let lazyOn = $state(false)
</script>

<div class="page">
	<header>
		<h1>ff()</h1>
		<p>
			The firstly reactive layer. <code>ff(E).many(getter, strategy?)</code> is a list + editing draft
			+ writes; <code>ff(E).one(getter)</code> is a single bound record. Imperative work stays on
			remult's <code>repo(E)</code>.
		</p>
	</header>

	<section>
		<div class="head">
			<h2>many</h2>
			<p>Same component, three fetch strategies. Add a row and watch each behave.</p>
		</div>
		<div class="cols">
			{#each strategies as strategy (strategy)}
				<article>
					<h3>{strategy}</h3>
					<DemoGrid
						entity={Task}
						fields={[...fields]}
						{strategy}
						pageSize={strategy === 'paginate' ? 2 : 25}
					/>
				</article>
			{/each}
		</div>
	</section>

	<section>
		<div class="head">
			<h2>one</h2>
			<p>A single record bound to <code>.item</code>.</p>
		</div>
		<div class="cols two">
			<article>
				<h3>bound record</h3>
				<p class="sub">findFirst by the entity's default order: the latest task.</p>
				<DemoForm entity={Task} fields={[...fields]} />
			</article>
		</div>
	</section>

	<section>
		<div class="head">
			<h2>lazy</h2>
			<p>A <code>many</code> list with <code>enabled</code>: nothing fetches until you turn it on.</p>
		</div>
		<div class="cols two">
			<article>
				<h3>enabled gate</h3>
				<button class="lazybtn" class:on={lazyOn} onclick={() => (lazyOn = !lazyOn)}>
					{lazyOn ? 'enabled: true (fetching)' : 'enabled: false (click to load)'}
				</button>
				<DemoGrid entity={Task} fields={[...fields]} strategy="load" enabled={lazyOn} />
			</article>
		</div>
	</section>
</div>

<style>
	.page {
		max-width: 1100px;
		display: flex;
		flex-direction: column;
		gap: 44px;
	}
	header h1 {
		font-size: 40px;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0;
		font-family: ui-monospace, 'SF Mono', monospace;
		color: oklch(0.82 0.13 165);
	}
	header p {
		margin: 8px 0 0;
		max-width: 68ch;
		line-height: 1.6;
		opacity: 0.82;
	}
	section {
		display: flex;
		flex-direction: column;
		gap: 16px;
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
	.head p {
		margin: 4px 0 0;
		opacity: 0.65;
		font-size: 14px;
	}
	.cols {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
		gap: 18px;
		align-items: start;
	}
	.cols.two {
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	}
	article {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 18px;
		border-radius: 14px;
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
	.sub {
		margin: -4px 0 0;
		font-size: 12.5px;
		opacity: 0.6;
	}
	.lazybtn {
		display: inline-block;
		width: auto;
		align-self: start;
		cursor: pointer;
		font: inherit;
		font-size: 13px;
		padding: 7px 14px;
		color: inherit;
		background: color-mix(in srgb, currentColor 9%, transparent);
		border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
		border-radius: 8px;
		transition:
			background 0.14s ease,
			border-color 0.14s ease;
	}
	.lazybtn:hover {
		background: color-mix(in srgb, currentColor 16%, transparent);
	}
	.lazybtn.on {
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
