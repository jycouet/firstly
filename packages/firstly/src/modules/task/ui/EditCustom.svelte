<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import type { CustomFieldType } from '$lib/svelte/customField'

	interface Props extends CustomFieldType {}
	let { field, value = $bindable(), mode, error }: Props = $props()
	$inspect(value)
</script>

EditCustom 🚀
<input bind:value />
