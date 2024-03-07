<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import type { HTMLInputAttributes } from 'svelte/elements'

	import { tw } from '../../utils/tailwind'

	export let value: HTMLInputAttributes['value'] = undefined

	const dispatch = createEventDispatcher()

	// OPTION Focus
	// const focus = async (el) => tick().then(() => el.focus())
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
		dispatch('input', { value })
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
	on:keyup
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
