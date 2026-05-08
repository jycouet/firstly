<script lang="ts">
	import { onDestroy, onMount } from 'svelte'
	import { repo } from 'remult'

	import { Mail } from '../Mail'

	type Props = { limit?: number }
	let { limit = 30 }: Props = $props()

	let mails: Mail[] = $state([])
	let unsubscribe: (() => void) | null = null

	onMount(() => {
		unsubscribe = repo(Mail)
			.liveQuery({ limit })
			.subscribe((res) => {
				mails = res.items
			})
	})

	onDestroy(() => {
		if (unsubscribe) unsubscribe()
	})

	function parseTo(raw: string): string {
		try {
			const v = JSON.parse(raw)
			if (Array.isArray(v)) return v.join(', ')
			return String(v)
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
		if (status === 'sent') return 'bg-green-50 border-green-200 text-green-900'
		if (status === 'transport_not_configured')
			return 'bg-amber-50 border-amber-200 text-amber-900'
		return 'bg-red-50 border-red-200 text-red-900'
	}
</script>

<div class="flex flex-col gap-4 p-4">
	<div class="flex flex-col gap-2">
		<h2 class="text-2xl font-bold">Last mails</h2>
		<p class="text-sm text-zinc-600">{mails.length} mail{mails.length === 1 ? '' : 's'}</p>
	</div>

	{#if mails.length === 0}
		<div class="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
			No mails yet.
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each mails as m (m.id)}
				{@const subject = m.metadata?.subject as string | undefined}
				{@const messageId = m.metadata?.transport?.messageId as string | undefined}
				<div class="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-4">
					<div class="flex flex-wrap items-center gap-2">
						<span
							class="rounded border px-2 py-0.5 text-xs font-medium {badgeClass(m.status)}"
						>{m.status}</span>
						<span
							class="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-700"
						>{m.topic}</span>
						<span class="text-xs text-zinc-600">{parseTo(m.to)}</span>
						<span class="ml-auto text-xs text-zinc-500">{formatDate(m.createdAt)}</span>
					</div>

					<div class="text-base font-medium text-zinc-900">{subject || '(no subject)'}</div>

					{#if messageId}
						<div class="text-xs break-all text-zinc-500">id: <code>{messageId}</code></div>
					{/if}

					{#if m.status === 'error' && m.errorInfo}
						<pre
							class="rounded border border-red-200 bg-red-50 p-2 text-xs whitespace-pre-wrap text-red-900">{m.errorInfo}</pre>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
