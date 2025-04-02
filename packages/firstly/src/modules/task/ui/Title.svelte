<script lang="ts" generics="valueType = unknown, entityType = unknown">
	import type { CustomFieldDefaultProps } from '$lib/svelte/customField'

	interface Props extends CustomFieldDefaultProps {}
	let { field, value, error }: Props = $props()
</script>

<div>
	<b>TITLE STYLE</b>: "<span style="color: yellow;">{value}</span>"
</div>
