<script lang="ts" module>
	import type { WithElementRef } from 'bits-ui'
	import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements'
	import { type VariantProps, tv } from 'tailwind-variants'

	export const badgeVariants = tv({
		base: 'inline-flex items-center justify-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 transition-[color,box-shadow] overflow-hidden',
		variants: {
			variant: {
				default: 'border-transparent bg-primary text-primary-foreground',
				secondary: 'border-transparent bg-secondary text-secondary-foreground',
				destructive: 'border-transparent bg-destructive text-destructive-foreground',
				outline: 'text-foreground',
				success: 'border-transparent bg-emerald-500 text-white dark:bg-emerald-600',
			},
		},
		defaultVariants: { variant: 'default' },
	})

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

	export type BadgeProps = WithElementRef<HTMLAttributes<HTMLSpanElement> & HTMLAnchorAttributes> & {
		variant?: BadgeVariant
		href?: string
	}
</script>

<script lang="ts">
	import { cn } from '../../../utils.js'

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = 'default',
		children,
		...restProps
	}: BadgeProps = $props()
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	bind:this={ref}
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
