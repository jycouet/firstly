<script lang="ts" generics="entityType = unknown">
	import { untrack } from 'svelte'

	import { FF_Form, FF_Grid } from './'
	import type { FF_Repo } from './'
	import type { Layout } from './customField'

	interface Props<entityType = unknown> {
		r: FF_Repo<entityType>
		layout?: Layout<entityType>
		classes_goups?: string // TODO: Make a themeLayout
	}

	let { r, layout, classes_goups }: Props<entityType> = $props()

	const layoutToUse: Layout<entityType> = $derived(layout ?? r.getLayout())

	let selectedThing: string | undefined = $state(undefined)
	$effect(() => {
		untrack(() => {
			selectedThing = layoutToUse.groups?.[0]?.key
		})
	})
</script>

{#if layoutToUse.type === 'detail'}
	<FF_Form {r} groups={layoutToUse.groups} classes={{ groups: classes_goups }}></FF_Form>
{:else if layoutToUse.type === 'grid'}
	<FF_Grid {r}></FF_Grid>
{:else if layoutToUse.type === 'tab'}
	<div role="tablist" class="tabs tabs-lifted">
		{#each layoutToUse.groups ?? [] as group (group.key)}
			<input
				type="radio"
				name="my-tabs"
				role="tab"
				class="tab"
				checked={selectedThing === group.key}
				onchange={() => (selectedThing = group.key)}
				aria-label={group.caption}
			/>
			<div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6">
				<FF_Form {r} groups={[group]} show={{ title: false }}></FF_Form>
			</div>
		{/each}
	</div>
{:else if layoutToUse.type === 'accordion'}
	{#each layoutToUse.groups ?? [] as group (group.key)}
		<div class="bg-base-100 collapse">
			<input
				type="radio"
				name="my-accordion"
				checked={selectedThing === group.key}
				onchange={() => selectedThing === group.key}
			/>
			<div class="collapse-title text-xl font-medium">{group.caption}</div>
			<div class="collapse-content">
				<FF_Form {r} groups={[group]} show={{ title: false }}></FF_Form>
			</div>
		</div>
	{/each}
{/if}
