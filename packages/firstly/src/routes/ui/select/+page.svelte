<script lang="ts">
	import { repo } from 'remult'
	import Select2 from 'firstly/ui/internals/select/Select2.svelte'
	import SelectMelt from 'firstly/ui/internals/select/SelectMelt.svelte'

	import { cellsBuildor } from '$lib/internals/cellsBuildor'
	import { storeItem } from '$lib/internals/storeItem'
	import FieldGroup from '$lib/ui/FieldGroup.svelte'
	import { UIEntity } from '$lib/virtual/UIEntity'
	import type { BaseItem } from 'firstly/internals'

	const repoUi = repo(UIEntity)

	const cells = cellsBuildor(repoUi, ['state'])

	const store = storeItem(repoUi)
	store.fetch(-1)

	const items: BaseItem[] = [
		{ id: '1', caption: 'One' },
		{ id: '2', caption: 'Two' },
		{ id: '3', caption: 'Three' },
	]

	let value = $state<string | undefined>(undefined)
</script>

<div class="grid grid-cols-3 gap-4">
	<FieldGroup {cells} {store} />
	<Select2 bind:value {items} clearable />
	<SelectMelt
	bind:value
		id="whatever"
		{items}
		clearable
	/>

	<div>
		Data
		<pre>{JSON.stringify($store, null, 2)}</pre>
	</div>

	<div>
		Value
		<pre>{value}</pre>
	</div>
</div>
