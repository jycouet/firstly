<script lang="ts" generics="entityType = unknown">
	import { untrack } from 'svelte'

	import { FF_Form } from './'
	import type { FF_Repo, FieldGroup } from './'

	interface Props<entityType = unknown> {
		r: FF_Repo<entityType>
		type: 'columns' | 'tabs' | 'accordions'
		groups?: FieldGroup<entityType>[]
		classes_goups?: string // TODO: Make a themeLayout
	}

	let { r, type, groups, classes_goups }: Props<entityType> = $props()

	let selectedTab: string | undefined = $state(undefined)
	$effect(() => {
		untrack(() => {
			selectedTab = groups?.[0]?.key
		})
	})
</script>

{#if type === 'columns'}
	<FF_Form {r} {groups} classes={{ groups: classes_goups }}></FF_Form>
{:else if type === 'tabs'}
	<div role="tablist" class="tabs tabs-lifted">
		{#each groups ?? [] as group (group.key)}
			<input
				type="radio"
				name="my-tabs"
				role="tab"
				class="tab"
				checked={selectedTab === group.key}
				onchange={() => (selectedTab = group.key)}
				aria-label={group.caption}
			/>
			<div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6">
				<FF_Form {r} groups={[group]} show={{ title: false }}></FF_Form>
			</div>
		{/each}
	</div>
{:else if type === 'accordions'}
	{#each groups ?? [] as group (group.key)}
		<div class="bg-base-100 collapse">
			<input
				type="radio"
				name="my-accordion"
				checked={selectedTab === group.key}
				onchange={() => selectedTab === group.key}
			/>
			<div class="collapse-title text-xl font-medium">{group.caption}</div>
			<div class="collapse-content">
				<FF_Form {r} groups={[group]} show={{ title: false }}></FF_Form>
			</div>
		</div>
	{/each}
{/if}
