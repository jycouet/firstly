<script lang="ts">
	import { tw, type KitBaseItemLight } from '../..'
	import Icon from '../Icon.svelte'
	import Link from './Link.svelte'

	export let item: KitBaseItemLight | undefined
	export let noIcon = false
</script>

<div class="flex items-center gap-4">
	{#if item}
		{#if item.icon && !noIcon}
			<Icon data={item.icon.data} class={tw('flex-shrink-0', item.icon.class)} size={item.icon.size} />
		{/if}
		<div class="flex flex-col">
			{#if item.href}
				<Link href={item.href}>{item.caption}</Link>
			{:else}
				<span class="text-base-content">{item.caption}</span>
			{/if}
			{#if item.captionSub}
				<span class="text-xs italic text-base-content/70">{item.captionSub}</span>
			{/if}
		</div>
	{/if}
</div>
