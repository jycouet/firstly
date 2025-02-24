<script lang="ts">
  /**
   * @param value to set in the clipboard if not null.
   *
   * Don't put this on an input, if not, when a user will select the input via the mouse, this clipboard will be copied (usually you wanted to paste)!
   */
  export let value: string | null
  export { extraClass as class }

  let extraClass = ''

  async function clip(_value: string | null) {
    if (_value) {
      try {
        await navigator.clipboard.writeText(_value)
      } catch (error) {}
    }
  }
</script>

<span
  role="button"
  tabindex="0"
  on:keyup={() => {}}
  on:click={() => clip(value)}
  class={`${value ? 'cursor-copy' : ''} ${extraClass}`}
>
  <slot />
</span>
