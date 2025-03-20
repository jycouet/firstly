<script lang="ts">
  import { setTheme, type Theme } from './theme'

  export let theme: Theme = {}
  
  // Set the theme in the context
  setTheme(theme)
</script>

<slot /> 