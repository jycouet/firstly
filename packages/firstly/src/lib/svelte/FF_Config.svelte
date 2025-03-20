<script lang="ts">
	import type { DynamicCustomField } from './customField'
	import { setDynamicCustomField, setTheme, type Theme } from './ff_Config'

	interface Props {
		theme?: Theme
		dynamicCustomField?: DynamicCustomField
		children?: import('svelte').Snippet
	}

	let { theme = {}, dynamicCustomField: customField, children }: Props = $props()

	// Set the theme in the context
	setTheme(theme)

	// Set the customField function in the context if provided
	if (customField) {
		setDynamicCustomField(customField)
	}
</script>

{@render children?.()} setDynamicCustomField
