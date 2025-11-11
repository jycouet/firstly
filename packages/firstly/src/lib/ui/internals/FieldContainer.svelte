<script lang="ts">
	import { tw } from '../../utils/tailwind'

	interface Props {
		label?: string
		forId: string
		required?: boolean
		error?: string
		/**
		 * example usage for paginate
		 * classes={{ label: 'justify-end' }}
		 */
		classes?: { label?: string; slot?: string }
		children?: import('svelte').Snippet
	}

	let {
		label = 'label',
		forId,
		required = false,
		error = '',
		classes = {},
		children,
	}: Props = $props()
</script>

<fieldset class="fieldset w-full">
	<label for={forId} class={tw(`label flex gap-1 px-2`, classes.label)}>
		<span class="label-text pl-2 text-xs text-base-content/60">
			{label}{required ? ' *' : ''}
		</span>
		{#if error}
			<span class="label-text-alt truncate text-error">{error}</span>
		{/if}
	</label>
	<div class={tw('grid h-12 w-full text-base', classes.slot)}>
		{@render children?.()}
	</div>
</fieldset>
