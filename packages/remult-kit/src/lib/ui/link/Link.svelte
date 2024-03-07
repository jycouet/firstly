<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements'

	export let href: string
	export let target: HTMLAnchorAttributes['target'] = undefined

	export let kind: 'info' | 'ghost' = 'info'
	const daisy = { info: 'link-info', ghost: '' }

	let className: string | undefined | null = undefined
	export { className as class }
</script>

<a
	class={`${daisy[kind]} link no-underline hover:underline ${className ?? ''}`}
	{href}
	rel="noopener"
	{target}
	{...$$restProps}
>
	<slot />
</a>

<style>
	a[target='_blank']::after {
		display: inline-block;
		content: '⇱';
		position: relative;
		top: -3px;
		margin-left: 3px;
		transform: rotate(90deg);
	}
</style>
