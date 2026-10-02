<script lang="ts">
	import { repo } from 'remult'
	import { errorMessage } from 'firstly'
	import { AtSpace, AtSpaceMember, copyAtRecord } from 'firstly/atproto'
	import type { CellInput } from 'firstly/svelte'
	import { FF_Grid } from 'firstly/svelte'

	import { page } from '$app/state'

	import { FfNote, FfReview, GetairNote } from '$lib/entities'

	import Did, { identity } from './Did.svelte'
	import DraftActions from './DraftActions.svelte'

	let { me, initialSpace = '' }: { me: string; initialSpace?: string } = $props()

	let space = $state(initialSpace)
	let memberId = $state('')
	let memberRead = $state(true)
	let memberWrite = $state(true)
	let error = $state('')
	let busy = $state(false)
	let authorDids = $state<string[]>([])
	let reviews = $state<FfReview[]>([])
	let published = $state<string[]>([])
	let tick = $state(0)

	const memberCells: CellInput<AtSpaceMember>[] = [
		{ col: 'did', component: () => Did, rowToProps: (r) => ({ did: r.did }) },
		'read',
		'write',
	]

	const authority = $derived(space.split('/')[2] ?? '')
	// airspace workspaces hold their own note lexicon; a throwaway grant only covers that one.
	const getair = $derived(space.split('/')[4] === 'space.getair.notes.workspace')
	const owner = $derived(authority === me)
	const shareUrl = $derived(`${page.url.origin}/?tab=spaces&space=${encodeURIComponent(space)}`)

	const run = async (fn: () => Promise<unknown>) => {
		error = ''
		busy = true
		try {
			await fn()
			tick++
		} catch (e) {
			error = errorMessage(e)
		} finally {
			busy = false
		}
	}

	// Members can read every member's repo in the space; the member list itself is owner-only.
	// A member on a stock PDS has no repo in the space to read.
	const authors = async () => {
		const dids = [me, authority]
		try {
			for (const m of await repo(AtSpaceMember).find({ where: { space } })) dids.push(m.did)
		} catch {}
		const unique = dids.filter((d, i) => dids.indexOf(d) === i)
		const ok = await Promise.all(
			unique.map((d) =>
				identity(d).then(
					(i) => i.spaces,
					() => false,
				),
			),
		)
		return unique.filter((_, i) => ok[i])
	}

	$effect(() => {
		void tick
		if (!space) return
		authors().then(async (did) => {
			try {
				authorDids = did
				if (getair) return
				reviews = await repo(FfReview).find({ where: { space, did } })
				published = (await repo(FfNote).find({ where: { did: authority } })).map((n) => n.rkey)
			} catch (e) {
				error = errorMessage(e)
			}
		})
	})

	// Copy, not move: the draft stays in the space so its reviews keep pointing at it.
	// Overwrite: publishing again pushes the edited draft over the public copy.
	const publish = (d: FfNote) =>
		run(() => copyAtRecord(repo(FfNote), d.uri, { space: null, overwrite: true }))
	const review = (d: FfNote, text: string) =>
		run(() => repo(FfReview).insert({ space, noteUri: d.uri, text }))

	const draftCells = $derived<CellInput<FfNote>[]>([
		'title',
		'body',
		{ col: 'did', caption: 'Author', component: () => Did, rowToProps: (r) => ({ did: r.did, me }) },
		{
			col: 'rkey',
			caption: 'Reviews',
			component: () => DraftActions,
			rowToProps: (r: FfNote) => ({
				draft: r,
				me,
				busy,
				published: published.includes(r.rkey),
				reviews: reviews.filter((x) => x.noteUri === r.uri),
				onpublish: publish,
				onreview: review,
			}),
		},
	])
</script>

<div class="flex flex-col gap-6">
	{#if error}<p class="text-destructive">{error}</p>{/if}

	<section>
		<h2 class="mb-2 font-medium">1. spaces you write in - click one</h2>
		{#key tick}<FF_Grid
				entity={AtSpace}
				strategy="load"
				insert={{
					cells: ['type', 'skey', 'readPolicy', 'writePolicy'],
					defaults: { type: 'fun.firstly.demo.note', skey: 'draft' },
				}}
				onrowclick={(sp) => (space = sp.uri)}
				selected={(sp) => sp.uri === space}
				onchange={(e) => {
					if (e.type === 'insert') space = e.item.uri
					if (e.type === 'delete' && e.item.uri === space) space = ''
					tick++
				}}
			/>{/key}
		<p class="text-muted-foreground mt-2 text-xs">
			A PDS only lists spaces you have written in. Invited somewhere? Paste the link you got:
		</p>
		<input
			bind:value={space}
			placeholder="at://did:plc:.../space/fun.firstly.demo.note/draft"
			class="border-input mt-1 w-full rounded-md border px-2 py-1"
		/>
	</section>

	{#if space}
		{#if owner}
			<section>
				<h2 class="mb-2 font-medium">2. owner: invite reviewers, send them the link</h2>
				<form
					class="mb-2 flex flex-wrap items-center gap-2"
					onsubmit={(e) => {
						e.preventDefault()
						run(async () => {
							const { did, handle, spaces } = await identity(memberId.trim())
							if (!spaces)
								throw new Error(`@${handle}'s PDS has no spaces support, they could not read or write here`)
							await repo(AtSpaceMember).insert({ space, did, read: memberRead, write: memberWrite })
							memberId = ''
						})
					}}
				>
					<input
						bind:value={memberId}
						placeholder="handle or did"
						class="border-input rounded-md border px-2 py-1"
					/>
					<label class="flex items-center gap-1"
						><input type="checkbox" bind:checked={memberRead} /> read</label
					>
					<label class="flex items-center gap-1"
						><input type="checkbox" bind:checked={memberWrite} /> write</label
					>
					<button class="border-border rounded-md border px-3 py-1" disabled={busy}
						>{busy ? '…' : 'add'}</button
					>
				</form>
				{#key `${space}${tick}`}<FF_Grid
						entity={AtSpaceMember}
						cells={memberCells}
						where={{ space }}
						strategy="load"
						onchange={() => tick++}
					/>{/key}
				<p class="mt-2 text-xs">share: <code class="select-all">{shareUrl}</code></p>
			</section>
		{/if}

		<section>
			<h2 class="mb-2 font-medium">3. drafts in the space (each member writes in their own repo)</h2>
			{#key `${space}${authorDids.join()}${tick}`}{#if getair}<FF_Grid
						entity={GetairNote}
						cells={['title', 'body', 'createdAt']}
						where={{ space, did: authorDids }}
						strategy="load"
						insert={{ cells: ['title', 'body'], defaults: { space } }}
						update={{ cells: ['title', 'body'] }}
						onchange={() => tick++}
					/>{:else}<FF_Grid
						entity={FfNote}
						cells={draftCells}
						where={{ space, did: authorDids }}
						strategy="load"
						insert={{ cells: ['title', 'body'], defaults: { space } }}
						update={{ cells: ['title', 'body', 'done'] }}
						onchange={() => tick++}
					/>{/if}{/key}
		</section>
	{/if}
</div>
