<script lang="ts">
  import { setTheme, type Theme } from './ff_Config'

  interface Props {
    theme?: Theme;
    children?: import('svelte').Snippet;
  }

  let { theme = {}, children }: Props = $props();
  
  // Set the theme in the context
  setTheme(theme)
</script>

{@render children?.()} 