<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet
  }

  let { children }: Props = $props()
</script>

<svelte:head>
  <script>
    window.firstlyData = { coucou: 'coucou2' }
  </script>
</svelte:head>

{@render children?.()}
