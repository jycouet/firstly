<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import type { CustomFieldDefaultProps } from '$lib/svelte/customField'

	interface Props extends CustomFieldDefaultProps {}
	let { field, value = $bindable(), error }: Props = $props()
</script>

<input bind:value />
<span>🚀 EditCustom 🚀</span>

<style>
	input {
		width: 100%;
		background-color: blue;
	}
</style>
