<script lang="ts">
	import { tw } from '../../utils/tailwind'

	export let label: string = 'label'
	export let forId: string
	export let required = false
	export let error: string = ''

	/**
	 * example usage for paginate
	 * classes={{ label: 'justify-end' }}
	 */
	export let classes: { label?: string; slot?: string } = {}
</script>

<div class="form-control w-full">
	<label for={forId} class={tw(`label flex gap-1 px-2 pb-1`, classes.label)}>
		<span class="label-text pl-2 text-xs text-base-content/60">
			{label}{required ? ' *' : ''}
		</span>
		{#if error}
			<!-- TODO hover popup if too long? -->
			<span class="label-text-alt truncate text-error">{error}</span>
		{/if}
	</label>
	<div class={tw('grid h-12 w-full', classes.slot)}>
		<slot />
	</div>
</div>
