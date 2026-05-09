<script lang="ts">
	import { onDestroy, onMount } from 'svelte'

	import { remult, repo } from 'remult'

	import { Mail } from '../Mail'
	import { Roles_Mail } from '../Roles_Mail'

	const hasAccess = $derived(remult.user?.roles?.includes(Roles_Mail.Mail_Admin) ?? false)

	type Props = {
		limit?: number
		/** Subscribe to a remult `liveQuery` so the list updates over SSE.
		 * Default `true`. Set to `false` to fall back to a one-shot fetch on
		 * mount (the Refresh button still works either way). */
		live?: boolean
	}
	let { limit = 30, live = true }: Props = $props()

	let mails: Mail[] = $state([])
	let isLoading = $state(false)
	let error = $state('')
	let unsubscribe: (() => void) | null = null

	export async function refresh() {
		isLoading = true
		error = ''
		try {
			mails = await repo(Mail).find({ limit })
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
		} finally {
			isLoading = false
		}
	}

	onMount(() => {
		if (live) {
			// Pass `orderBy` explicitly: remult keeps the live state sorted on
			// incremental adds/replaces only when `query.options.orderBy` is
			// set (the entity's `defaultOrderBy` only applies to the initial
			// fetch). Without this, new SSE rows would land at the bottom.
			unsubscribe = repo(Mail)
				.liveQuery({ limit, orderBy: { createdAt: 'desc' } })
				.subscribe((res) => {
					mails = res.items
					error = ''
				})
		} else {
			refresh()
		}
	})

	onDestroy(() => unsubscribe?.())

	function formatList(v: unknown): string {
		if (v == null) return ''
		if (Array.isArray(v)) return v.join(', ')
		return String(v)
	}

	function parseTo(raw: string): string {
		try {
			return formatList(JSON.parse(raw))
		} catch {
			return raw
		}
	}

	function formatDate(d: unknown): string {
		if (!d) return ''
		const date = d instanceof Date ? d : new Date(d as string)
		if (isNaN(date.getTime())) return String(d)
		return date.toLocaleString()
	}

	function badgeClass(status: Mail['status']): string {
		if (status === 'sent') return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
		if (status === 'transport_not_configured')
			return 'bg-amber-500/10 border-amber-500/40 text-amber-300'
		return 'bg-red-500/10 border-red-500/40 text-red-300'
	}
</script>

<div class="border border-slate-700 bg-slate-800 text-slate-200">
	<header class="flex flex-wrap items-center gap-3 border-b border-slate-700 px-5 py-4">
		<div class="flex flex-col">
			<h2 class="text-lg font-semibold text-slate-100">Last mails</h2>
			<p class="text-sm text-slate-400">Recent mails sent through this app.</p>
		</div>
		{#if hasAccess}
			<button
				type="button"
				onclick={refresh}
				disabled={isLoading}
				class="ml-auto inline-flex items-center gap-2 border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-600 disabled:opacity-50"
			>
				{#if isLoading}
					<svg
						class="h-4 w-4 animate-spin"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4"
						></circle>
						<path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" stroke-width="4" stroke-linecap="round"
						></path>
					</svg>
				{/if}
				Refresh
			</button>
			<span class="text-xs text-slate-500">
				{mails.length} mail{mails.length === 1 ? '' : 's'}
				{#if live}<span class="text-indigo-400">· live</span>{/if}
			</span>
		{/if}
	</header>

	<div class="p-5">
		{#if !hasAccess}
			<div class="border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
				You need the
				<code class="bg-amber-500/20 px-1 py-0.5 text-xs text-amber-100">Mail.Admin</code>
				role to use this.
			</div>
		{:else if error}
			<div class="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
		{:else if mails.length === 0}
			<div class="border border-slate-700 bg-slate-900 p-3 text-sm text-slate-400">No mails yet.</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each mails as m (m.id)}
					{@const subject = m.metadata?.subject as string | undefined}
					{@const cc = formatList(m.metadata?.cc)}
					{@const bcc = formatList(m.metadata?.bcc)}
					{@const messageId = m.metadata?.transport?.messageId as string | undefined}
					{@const preview = m.metadata?.transport?.preview as string | undefined}
					<article class="flex flex-col gap-2 border border-slate-700 bg-slate-900 p-4">
						<div class="flex flex-wrap items-center gap-2">
							<span class="border px-2 py-0.5 text-xs font-medium {badgeClass(m.status)}">{m.status}</span>
							<span
								class="border border-slate-600 bg-slate-700/50 px-2 py-0.5 text-xs font-medium text-slate-200"
								>{m.topic}</span
							>
							<span class="text-xs text-slate-400">{parseTo(m.to)}</span>
							<span class="ml-auto text-xs text-slate-500">{formatDate(m.createdAt)}</span>
						</div>

						<div class="text-base font-medium text-slate-100">{subject || '(no subject)'}</div>

						{#if cc}
							<div class="text-xs text-slate-500">cc: {cc}</div>
						{/if}
						{#if bcc}
							<div class="text-xs text-slate-500">bcc: {bcc}</div>
						{/if}

						{#if preview}
							<div class="text-xs">
								<a
									href={preview}
									target="_blank"
									rel="noopener noreferrer"
									class="text-indigo-400 underline hover:text-indigo-300">preview (mail not really sent)</a
								>
							</div>
						{/if}

						{#if messageId}
							<div class="text-xs break-all text-slate-500">id: <code>{messageId}</code></div>
						{/if}

						{#if m.status === 'error' && m.errorInfo}
							<pre
								class="border border-red-500/40 bg-red-500/10 p-2 text-xs whitespace-pre-wrap text-red-200">{m.errorInfo}</pre>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	</div>
</div>
