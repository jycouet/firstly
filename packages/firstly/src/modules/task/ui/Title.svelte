<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import type { CustomFieldType } from '$lib/svelte/customField'

	interface Props extends CustomFieldType {
	}
	// $bindable()
	let { field, value, mode, error }: Props = $props()
</script>

{mode}
<div>
	I'm rendering this... {field.key}!
</div>
<div>
	And this is the value: {value}
</div>
