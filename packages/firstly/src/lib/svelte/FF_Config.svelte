<script lang="ts">
	import { FF_Theme, setDynamicCustomField } from './'
	import type { DynamicCustomField, Theme } from './'

	interface Props {
		theme: Theme
		dynamicCustomField?: DynamicCustomField
		children?: import('svelte').Snippet
	}

	const { theme, dynamicCustomField, children }: Props = $props()

	// Create a reactive theme instance
	const themeManager = $state(new FF_Theme(theme))

	// Update theme when prop changes
	$effect(() => {
		themeManager.setTheme(theme)
	})

	// Setup dynamic custom field
	$effect(() => {
		if (dynamicCustomField) {
			setDynamicCustomField(dynamicCustomField)
		}
	})
</script>

{@render children?.()}
