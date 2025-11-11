<script lang="ts">
	interface Props {
		/**
		 * @param value to set in the clipboard if not null.		 *
		 * Don't put this on an input, if not, when a user will select the input via the mouse, this clipboard will be copied (usually you wanted to paste)!
		 */
		value: string | null
		class?: string
		children?: import('svelte').Snippet
	}

	let { value, class: extraClass = '', children }: Props = $props()

	async function clip(_value: string | null) {
		if (_value) {
			try {
				await navigator.clipboard.writeText(_value)
			} catch (error) {}
		}
	}
</script>

<button onclick={() => clip(value)} class={`text-left ${value ? 'cursor-copy' : ''} ${extraClass}`}>
	{@render children?.()}
</button>
