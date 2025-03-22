<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import type { CustomFieldDefaultProps } from '$lib/svelte/customField'

	interface Props extends CustomFieldDefaultProps {}
	let { field, value = $bindable(), error }: Props = $props()
</script>

EditCustom 🚀
<input bind:value />
