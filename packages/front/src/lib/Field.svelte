<script lang="ts">
  import type { FullAutoFill } from 'svelte/elements'

  interface Props {
    id: string
    type?: string
    label: string
    value: string
    placeholder: string
    autocomplete?: FullAutoFill | null | undefined
    error?: string
  }

  let {
    id,
    type = 'text',
    label,
    value = $bindable(),
    placeholder,
    autocomplete,
    error,
  }: Props = $props()
</script>

<div>
  <div class="flex justify-between">
    <label class="fieldset-label" for={id}>{label}</label>
    <span class="text-error">{error}</span>
  </div>
  <input {id} {type} {autocomplete} bind:value {placeholder} class="input w-full" />
</div>
