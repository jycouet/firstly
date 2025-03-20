<script lang="ts">
  import { setTheme, setCustomFieldFunction, type CustomFieldFunction, type Theme } from './ff_Config'

  interface Props {
    theme?: Theme;
    customField?: CustomFieldFunction;
    children?: import('svelte').Snippet;
  }

  let { theme = {}, customField, children }: Props = $props();
  
  // Set the theme in the context
  setTheme(theme)
  
  // Set the customField function in the context if provided
  if (customField) {
    setCustomFieldFunction(customField)
  }
</script>

{@render children?.()} 