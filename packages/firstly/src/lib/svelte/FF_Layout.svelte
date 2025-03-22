<script lang="ts" generics="entityType = unknown">
	import { untrack } from 'svelte'

	import { type FieldMetadata } from 'remult'

	import { FF_Form } from './'
	import type { FF_Repo } from './'

	interface Props<entityType> {
		r: FF_Repo<entityType>
		type: 'columns' | 'tabs' | 'accordions'
		grouping?: {
			key: string
			caption: string
			fields: FieldMetadata<unknown, entityType>[]
			class?: string
		}[]
	}

	let { r, type, grouping }: Props<entityType> = $props()

	let selectedTab: string | undefined = $state(undefined)
	$effect(() => {
		untrack(() => {
			selectedTab = grouping?.[0]?.key
		})
	})
</script>

{#if type === 'columns'}
	<div class="grid grid-cols-4 gap-2">
		{#each grouping ?? [] as group (group.key)}
			<div class={group.class}>
				<h2 class="text-2xl">{group.caption}</h2>
				<FF_Form {r} fields={group.fields}></FF_Form>
			</div>
		{/each}
	</div>
{:else if type === 'tabs'}
	<div role="tablist" class="tabs tabs-lifted">
		{#each grouping ?? [] as group (group.key)}
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
				<FF_Form {r} fields={group.fields}></FF_Form>
			</div>
		{/each}
	</div>
{:else if type === 'accordions'}
	{#each grouping ?? [] as group (group.key)}
		<div class="bg-base-100 collapse">
			<input
				type="radio"
				name="my-accordion"
				checked={selectedTab === group.key}
				onchange={() => selectedTab === group.key}
			/>
			<div class="collapse-title text-xl font-medium">{group.caption}</div>
			<div class="collapse-content">
				<FF_Form {r} fields={group.fields}></FF_Form>
			</div>
		</div>
	{/each}
{/if}
