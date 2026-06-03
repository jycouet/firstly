<script lang="ts">
	import type { Component } from 'svelte'

	import type { ClassType } from 'remult'

	import FF_Config from '../../FF_Config.svelte'
	import FF_Form from '../FF_Form.svelte'

	let { entity, input }: { entity: ClassType<any>; input: Component } = $props()
</script>

<FF_Config cell={{ inputs: { text: input } }}>
	<FF_Form {entity} />
</FF_Config>
