<script lang="ts">
	import type { Component } from 'svelte'

	import type { ClassType } from 'remult'
	import { FF_Config, FF_DialogManager, type CellInput } from 'firstly/svelte'

	import App_Grid from '../App_Grid.svelte'

	let {
		entity,
		input,
		cells,
	}: {
		entity: ClassType<any>
		input: Component
		cells?: CellInput<any>[]
	} = $props()
</script>

<FF_Config cell={{ inputs: { text: input, number: input, checkbox: input } }}>
	<App_Grid {entity} {cells} />
	<FF_DialogManager />
</FF_Config>
