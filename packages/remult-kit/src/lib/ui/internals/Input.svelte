<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { HTMLInputAttributes } from 'svelte/elements'

  import { tw } from '../../utils/tailwind'

  export let value: HTMLInputAttributes['value'] = undefined

  const dispatch = createEventDispatcher()

  export let focus: boolean = false
  const focusNow = (node: any) => {
    if (focus) {
      node.focus()
    }
  }

  // OPTION Dedounce
  export let withDedounce: boolean = false
  let timer: any = null
  const debounce = (fn: () => void) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn()
    }, 444)
  }
  function dispatchInput(value: any) {
    if ($$restProps.type === 'date') {
      if (value) {
        dispatch('input', { value: transformDate(value) })
      }
    } else {
      dispatch('input', { value })
    }
  }

  let className: string | undefined | null = undefined
  export { className as class }

  const handleInput = (e: any) => {
    const target: HTMLInputElement = e.target as HTMLInputElement

    if ($$restProps.type === 'number') {
      // If we see a `.` or a `,` don't continue and wait for the next input !
      if (e.data === '.' || e.data === ',') {
        e.preventDefault()
      } else {
        value = +target.value
      }
    } else {
      value = target.value
    }

    if (withDedounce) {
      return debounce(() => {
        dispatchInput(value)
      })
    } else {
      dispatchInput(value)
    }
  }

  const transformDate = (input: string) => {
    const rawDateSplited = input.split('-')

    if (rawDateSplited.length === 3) {
      const yearSplited = rawDateSplited[0].split('')
      if (
        yearSplited.length === 4 &&
        yearSplited[0] === '0' &&
        yearSplited[1] === '0' &&
        yearSplited[2] !== '0'
      ) {
        return `20${yearSplited[2]}${yearSplited[3]}-${rawDateSplited[1]}-${rawDateSplited[2]}`
      }
    }

    return input
  }

  const handleKeyup = (event: KeyboardEvent) => {
    if ($$restProps.type === 'date') {
      // @ts-ignore
      value = transformDate(event.target.value)
    }
  }
</script>

<input
  use:focusNow
  class={tw('w-full px-2', className)}
  on:input={handleInput}
  bind:value
  on:blur
  on:change
  on:click
  on:focus
  on:keydown
  on:keypress
  on:keyup={handleKeyup}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:paste
  {...$$restProps}
/>

<style>
  input[type='number'] {
    -webkit-appearance: textfield;
    -moz-appearance: textfield;
    appearance: textfield;
  }

  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
  }
</style>
