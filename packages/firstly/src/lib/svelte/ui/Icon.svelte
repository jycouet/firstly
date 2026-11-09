<script module lang="ts">
	const REGEX_WIDTH = /width="[^"]*"/
	const REGEX_HEIGHT = /height="[^"]*"/
	const REGEX_SVG = /<svg/i
</script>

<script lang="ts">
	import { BROWSER } from 'esm-env'
	import type { Snippet } from 'svelte'
	import type { SVGAttributes } from 'svelte/elements'

	import {
		getIconContext,
		iconInner,
		isIconNode,
		pick,
		requestSprites,
		spriteInner,
		strokeAttrs,
		type IconData,
		type IconSsr,
	} from './icon.js'

	type Props = Omit<SVGAttributes<SVGSVGElement>, 'class' | 'style'> & {
		/**
		 * `d` path(s) (`@mdi/js`), an `<svg>` string, or a Lucide icon node (`import { Skull } from 'lucide'`).
		 */
		data?: IconData
		size?: string | number
		/** Accessible name. Without it, the icon is `aria-hidden`. */
		caption?: string
		/** Server rendering, see {@link IconSsr}. Defaults to `setIconOptions` then `'sprite'`. */
		ssr?: IconSsr
		/** Lucide icons only. Defaults to `setIconOptions` then `2`. */
		strokeWidth?: number | string
		viewBox?: string
		/** An array styles each path of a `string[]` data (index 0 also styles the `<svg>`). */
		class?: string | string[]
		style?: string | string[]
		children?: Snippet
	}

	let {
		data = '',
		size = '1.5rem',
		caption,
		ssr,
		strokeWidth,
		viewBox = '0 0 24 24',
		class: className = '',
		style = '',
		children,
		...rest
	}: Props = $props()

	const ctx = getIconContext()

	const mode = $derived(ssr ?? ctx?.ssr ?? 'sprite')
	const svg = $derived(typeof data === 'string' && REGEX_SVG.test(data) ? data : '')
	const node = $derived(isIconNode(data))
	const inner = $derived(svg ? '' : iconInner(data, className, style))
	const stroke = $derived(node ? strokeAttrs(strokeWidth ?? ctx?.strokeWidth) : {})
	// Server box and sprite skip them on the <svg>: spread attributes are set again on hydration
	const svgStroke = $derived(BROWSER || mode === true ? stroke : {})

	// Server branches differ from the browser one on purpose: hydration repairs the mismatch, the browser always draws inline.
	// Server only, evaluated once: the shared request registry decides who carries the <symbol>
	const sprite = () => {
		const sprites = ctx?.sprites ?? requestSprites()
		return sprites ? spriteInner(sprites, inner, viewBox, stroke) : inner
	}
</script>

{#if (svg || children) && (BROWSER || mode)}
	<span
		class={pick(className) || undefined}
		style={pick(style) || undefined}
		style:width={size}
		style:height={size}
		role="img"
		aria-label={caption}
		aria-hidden={caption ? undefined : 'true'}
	>
		{#if children}
			{@render children()}
		{:else}
			{@html svg.replace(REGEX_WIDTH, `width="${size}"`).replace(REGEX_HEIGHT, `height="${size}"`)}
		{/if}
	</span>
{:else}
	<svg
		{...rest}
		{...svgStroke}
		width={size}
		height={size}
		{viewBox}
		class={pick(className) || undefined}
		style={pick(style) || undefined}
		role="img"
		aria-label={caption}
		aria-hidden={caption ? undefined : 'true'}
	>
		{#if BROWSER || mode === true}
			{@html inner}
		{:else if mode === 'sprite'}
			{@html sprite()}
		{/if}
	</svg>
{/if}
