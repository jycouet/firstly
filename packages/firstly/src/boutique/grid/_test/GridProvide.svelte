<script lang="ts">
	import type { Component } from 'svelte'

	import type { ClassType } from 'remult'

	import { FF_Config, FF_DialogManager } from 'firstly/svelte'

	import FF_Grid from '../FF_Grid.svelte'

	let {
		entity,
		input,
		selected,
		createFields,
		editFields,
	}: {
		entity: ClassType<any>
		input: Component
		selected?: string[]
		createFields?: string[]
		editFields?: string[]
	} = $props()
</script>

<FF_Config cell={{ inputs: { text: input, number: input, checkbox: input } }}>
	<FF_Grid {entity} {selected} {createFields} {editFields} />
	<FF_DialogManager />
</FF_Config>
