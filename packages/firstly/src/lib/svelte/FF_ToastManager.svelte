<script lang="ts">
	import type { ToastRegionOptions } from '@ui-sdk/svelte/toast'
	import { Toast, ToastAction, ToastClose, ToastRegion, ToastTitle } from '@ui-sdk/svelte/toast'
	import { onMount } from 'svelte'

	import { resolveMessage } from '../core/FF_Validators.js'
	import { ffConfig } from './FF_Config.svelte.js'
	import { _setToastTitleResolver, type ToastData } from './toast.js'

	// Explicit props win over <FF_Config> toast over firstly defaults.
	let props: Partial<ToastRegionOptions> = $props()
	const cfg = ffConfig()

	// Bridge <FF_Config>'s per-kind titles into the (module-level) `toast` fn. Client-only:
	// toasts never fire during SSR, so this keeps no request-shared state on the server. The
	// closure re-reads config at toast time, so locale-aware message functions resolve fresh.
	onMount(() => {
		_setToastTitleResolver((kind) => resolveMessage(cfg.messages.toast[kind]))
	})

	// Colored per kind.
	const tone =
		'border-border bg-background text-foreground data-[type=error]:border-red-300 data-[type=error]:bg-red-50 data-[type=error]:text-red-700 data-[type=info]:border-blue-300 data-[type=info]:bg-blue-50 data-[type=info]:text-blue-700 data-[type=success]:border-green-300 data-[type=success]:bg-green-50 data-[type=success]:text-green-700 data-[type=warning]:border-amber-300 data-[type=warning]:bg-amber-50 data-[type=warning]:text-amber-700'
</script>

<!-- Precedence (later wins): firstly defaults → <FF_Config> toast → explicit props. -->
<ToastRegion side="top" align="end" {...cfg.toast} {...props} class="ff-toasts fixed z-[100] m-4">
	{#snippet children(item)}
		<Toast
			class="ff-toast flex items-start gap-3 rounded-lg border p-4 text-sm shadow-lg select-none {tone}"
		>
			<div class="min-w-0 flex-1">
				<ToastTitle class="font-semibold" />
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted by contract, see toast.ts -->
				<div class="mt-0.5">{@html (item.data as ToastData | undefined)?.html ?? ''}</div>
			</div>
			<ToastAction
				class="shrink-0 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background"
			/>
			<ToastClose aria-label="Close" class="shrink-0 opacity-60 hover:opacity-100">✕</ToastClose>
		</Toast>
	{/snippet}
</ToastRegion>

<style>
	/* Stack mechanics from ui-sdk's CSS variables: newest in front, the rest peek behind it. */
	:global(.ff-toasts) {
		width: min(356px, calc(100vw - 2rem));
		height: var(--toast-front-height);
		inset: 0 0 auto auto;
	}
	:global(.ff-toasts[data-side='bottom']) {
		inset: auto 0 0 auto;
	}
	:global(.ff-toasts[data-expanded]) {
		height: calc(var(--toast-stack-height) + (var(--toast-count) - 1) * 8px);
	}
	:global(.ff-toast) {
		--y: calc(var(--toast-index) * 10px);
		position: absolute;
		inset-inline: 0;
		top: 0;
		z-index: calc(100 - var(--toast-index));
		overflow: hidden;
		height: var(--toast-height);
		translate: var(--toast-swipe-x, 0px) calc(var(--y) + var(--toast-swipe-y, 0px));
		scale: calc(1 - var(--toast-index) * 0.05);
		transition-property: translate, scale, opacity, height;
		transition-duration: 300ms;
	}
	:global(.ff-toasts[data-side='bottom'] .ff-toast) {
		--y: calc(var(--toast-index) * -10px);
		top: auto;
		bottom: 0;
	}
	:global(.ff-toast:not([data-front], [data-expanded])) {
		height: var(--toast-front-height);
	}
	:global(.ff-toast:not([data-front], [data-expanded]) > *) {
		opacity: 0;
	}
	:global(.ff-toast[data-expanded]) {
		--y: calc(var(--toast-offset) + var(--toast-index) * 8px);
		scale: 1;
	}
	:global(.ff-toasts[data-side='bottom'] .ff-toast[data-expanded]) {
		--y: calc(-1 * (var(--toast-offset) + var(--toast-index) * 8px));
	}
	:global(.ff-toast:is([data-starting-style], [data-ending-style])) {
		opacity: 0;
	}
	:global(.ff-toast[data-starting-style][data-front]) {
		--y: -100%;
	}
	:global(.ff-toast:is([data-starting-style], [data-swiping])) {
		transition: none;
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.ff-toast) {
			transition-property: opacity;
		}
	}
</style>
