<script lang="ts">
	import { AtAny } from 'firstly/atproto'
	import type { CellInput } from 'firstly/svelte'
	import { FF_Grid } from 'firstly/svelte'

	import { enhance } from '$app/forms'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'

	import { FfNote } from '$lib/entities'
	import JsonCell from '$lib/JsonCell.svelte'

	import type { PageProps } from './$types'
	import Spaces from './Spaces.svelte'

	let { data, form }: PageProps = $props()

	let handle = $state(data.handle)
	let useToken = $state(false)
	const me = $derived(data.session?.did)
	const tabs = [
		['public', 'Public data'],
		['notes', 'CRUD fun.firstly.demo.note'],
		['spaces', 'Spaces'],
	] as const

	const anyCells: CellInput<AtAny>[] = [
		'rkey',
		{
			col: 'value',
			component: () => JsonCell,
			rowToProps: (r) => ({ value: r.value }),
			sortable: false,
		},
	]

	const go = (patch: Record<string, string>) =>
		goto(`?${new URLSearchParams({ tab: data.tab, handle, collection: data.collection, ...patch })}`)
</script>

<div class="flex flex-col gap-6 text-sm">
	<section class="flex flex-wrap items-center gap-3">
		<code class="text-muted-foreground text-xs">{data.pds}</code>
		{#if data.session}
			<span>@{data.session.handle}</span>
			<form method="POST" action="?/logout" use:enhance>
				<button class="border-border rounded-md border px-3 py-1 text-xs">log out</button>
			</form>
		{:else if useToken}
			<form method="POST" action="?/token" class="flex flex-wrap items-center gap-2" use:enhance>
				<input
					name="service"
					placeholder="https://getair.space"
					class="border-input rounded-md border px-2 py-1"
				/>
				<input name="did" placeholder="did:plc:..." class="border-input rounded-md border px-2 py-1" />
				<input
					name="token"
					type="password"
					placeholder="bearer token"
					class="border-input rounded-md border px-2 py-1"
				/>
				<button class="bg-foreground text-background rounded-md px-3 py-1">log in (token)</button>
				<button type="button" class="text-muted-foreground text-xs underline" onclick={() => (useToken = false)}>
					use OAuth
				</button>
			</form>
			{#if form?.message}<span class="text-destructive">{form.message}</span>{/if}
		{:else}
			<form method="POST" action="?/login" class="flex items-center gap-2">
				<input type="hidden" name="back" value={page.url.search} />
				<input
					name="handle"
					placeholder="you.bsky.social"
					class="border-input rounded-md border px-2 py-1"
				/>
				<button class="bg-foreground text-background rounded-md px-3 py-1">log in (OAuth)</button>
			</form>
			<button type="button" class="text-muted-foreground text-xs underline" onclick={() => (useToken = true)}>
				or service + did + bearer
			</button>
			{#if form?.message}<span class="text-destructive">{form.message}</span>{/if}
			{#if data.loopbackHint}
				<a class="text-muted-foreground text-xs underline" href={data.loopbackHint}>use 127.0.0.1</a>
			{/if}
		{/if}
	</section>

	<nav class="border-border flex gap-1 border-b">
		{#each tabs as [id, label] (id)}
			<a
				href="?{new URLSearchParams({ tab: id, handle, collection: data.collection })}"
				class="-mb-px border-b-2 px-3 py-2 {data.tab === id
					? 'border-foreground font-medium'
					: 'text-muted-foreground border-transparent'}"
			>
				{label}
			</a>
		{/each}
	</nav>

	{#if data.tab === 'public'}
		<form
			class="flex flex-wrap items-center gap-2"
			onsubmit={(e) => {
				e.preventDefault()
				go({ handle, collection: '' })
			}}
		>
			<input
				bind:value={handle}
				placeholder="any handle"
				class="border-input rounded-md border px-2 py-1"
			/>
			<button class="border-border rounded-md border px-3 py-1">load</button>
			{#if data.collections.length}
				<select
					class="border-input bg-card text-card-foreground rounded-md border px-2 py-1"
					value={data.collection}
					onchange={(e) => go({ collection: e.currentTarget.value })}
				>
					<option value="">pick a collection ({data.collections.length})</option>
					{#each data.collections as c (c)}<option value={c}>{c}</option>{/each}
				</select>
			{/if}
			{#if data.error}<span class="text-destructive">{data.error}</span>{/if}
		</form>
		{#if data.did && data.collection}
			{#key `${data.did}|${data.collection}`}
				<FF_Grid
					entity={AtAny}
					cells={anyCells}
					where={{ did: data.did, collection: data.collection }}
					strategy="load"
					pageSize={20}
				/>
			{/key}
		{/if}
	{:else if data.tab === 'notes'}
		{#if me}
			<p class="text-muted-foreground text-xs">
				<a class="underline" href="https://pdsls.dev/at://{me}/fun.firstly.demo.note" target="_blank"
					>see it on pdsls</a
				>
			</p>
			{#key me}<FF_Grid entity={FfNote} where={{ did: me }} strategy="load" pageSize={20} />{/key}
		{:else}
			<p class="text-muted-foreground">log in first</p>
		{/if}
	{:else if !me}
		<p class="text-muted-foreground">log in first</p>
	{:else if !data.session?.spaces}
		<p class="text-muted-foreground">
			Your PDS does not support permissioned spaces yet (hosted ones like bsky.social don't). They need
			the
			<a class="underline" href="https://atproto.com/blog/atproto-spaces-alpha" target="_blank"
				>spaces alpha</a
			>
			PDS - or a local one via airspace's <code>pnpm dev:pds</code>.
		</p>
	{:else}
		<Spaces {me} initialSpace={data.space} />
	{/if}
</div>

<style>
	select option {
		background: var(--color-card);
		color: var(--color-card-foreground);
	}
	:global([data-ff-grid-count]) {
		display: none;
	}
</style>
