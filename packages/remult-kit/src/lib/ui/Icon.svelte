<script lang="ts">
	import { BROWSER } from 'esm-env'

	import './LibIcon'

	import { LibIcon_Empty } from './LibIcon'

	/**
	 * directly <svg ... /> or d of <path ... />
	 *
	 * with \@mdi/js
	 * ```js
	 * import { mdiAccountTieWoman } from "@mdi/js";
	 * <Icon data={mdiAccountTieWoman} style="background-color: blue;" size={"4rem"}></Icon>
	 * ```
	 *
	 * with \@iconify-json/mdi && unplugin-icons with Icons({ compiler: "raw" })
	 * ```js
	 * import Woman from "virtual:icons/mdi/account-tie-woman";
	 * <Icon data={mdiAccountTieWoman} style="background-color: blue;" size={"4rem"}></Icon>
	 * ```
	 */
	export let data: string | string[] = ''

	export let size: string | number = '1.5rem'

	/**
	 * By default, svg are not rendered on the server side.
	 * But the size will be respected to not have glitch on the client side when the icon is coming.
	 * @default false
	 */
	export let ssr = false

	let className: string | string[] | undefined = ''
	export { className as class }
	export let style: string | string[] | undefined = ''

	let width = size
	let height = size
	let viewBox = '0 0 24 24'

	let svg = ''
	let path: string | string[] = ''

	$: if (typeof data === 'string') {
		if (data.toLowerCase().includes('<svg')) {
			svg = data
				.replace(/width="[^"]*"/, `width="${width}"`)
				.replace(/height="[^"]*"/, `height="${height}"`)
		} else {
			path = data
		}
	} else {
		path = data
	}

	const getInfoProps = (props: string | string[] | undefined, i: number = 0) => {
		if (Array.isArray(props)) {
			return props[i] ?? ''
		}
		return props ?? ''
	}
</script>

{#if BROWSER || ssr}
	{#if svg || $$slots.default}
		<span
			class={getInfoProps(className)}
			style={getInfoProps(style)}
			style:width
			style:height
			role={'img'}
			on:click
		>
			<slot>
				{@html svg ?? ''}
			</slot>
		</span>
	{:else}
		<svg
			{width}
			{height}
			{viewBox}
			class={getInfoProps(className)}
			style={getInfoProps(style)}
			role={'img'}
			on:click
		>
			{#each Array.isArray(path) ? path : [path] as d, i}
				<path
					{d}
					fill="currentColor"
					class={getInfoProps(className, i)}
					style={getInfoProps(style, i)}
				/>
			{/each}
		</svg>
	{/if}
{:else}
	<svg
		{width}
		{height}
		{viewBox}
		class={getInfoProps(className)}
		style={getInfoProps(style)}
		role={'img'}
		on:click
	>
		<path
			d={LibIcon_Empty}
			fill="currentColor"
			class={getInfoProps(className)}
			style={getInfoProps(style)}
		/>
	</svg>
{/if}
