<script lang="ts">
	import type { Component } from 'svelte'

	import type { ClassType } from 'remult'
	import { FF_Config } from 'firstly/svelte'

	import FF_Group from '../FF_Group.svelte'

	let { entity, input }: { entity: ClassType<any>; input: Component } = $props()
</script>

<FF_Config cell={{ inputs: { text: input } }}>
	<FF_Group {entity} />
</FF_Config>
