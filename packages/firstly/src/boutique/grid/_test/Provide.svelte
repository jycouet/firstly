<script lang="ts">
	import type { Component } from 'svelte'

	import type { ClassType } from 'remult'
	import { FF_Config } from 'firstly/svelte'

	import App_Group from '../App_Group.svelte'

	let { entity, input }: { entity: ClassType<any>; input: Component } = $props()
</script>

<FF_Config cell={{ inputs: { text: input } }}>
	<App_Group {entity} />
</FF_Config>
