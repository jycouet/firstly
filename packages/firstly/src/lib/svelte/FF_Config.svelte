<script lang="ts">
	import type { DynamicCustomField, Theme } from './'
	import { setDynamicCustomField, setTheme } from './'

	interface Props {
		theme?: Theme
		dynamicCustomField?: DynamicCustomField
		children?: import('svelte').Snippet
	}

	let { theme = {}, dynamicCustomField, children }: Props = $props()

	// Set the theme in the context
	setTheme(theme)

	// Set the customField function in the context if provided
	if (dynamicCustomField) {
		setDynamicCustomField(dynamicCustomField)
	}
</script>

{@render children?.()}
