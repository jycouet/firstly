<script lang="ts">
	import { MailController } from '../MailController'

	let to = $state('')
	let subject = $state('')
	let body = $state('')
	let isLoading = $state(false)

	let result: { ok: boolean; messageId: string | null } | null = $state(null)
	let error = $state('')

	async function handleSubmit(e: Event) {
		e.preventDefault()
		result = null
		error = ''
		isLoading = true
		try {
			const r = await MailController.sendTest({ to, subject, body })
			if (r.ok) {
				result = { ok: true, messageId: r.messageId }
			} else {
				error = r.error ?? 'Unknown error'
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
		} finally {
			isLoading = false
		}
	}
</script>

<div class="flex flex-col gap-4 p-4">
	<div class="flex flex-col gap-2">
		<h2 class="text-2xl font-bold">Write mail</h2>
		<p class="text-sm text-zinc-600">Send a test mail through the configured transport.</p>
	</div>

	<form onsubmit={handleSubmit} class="flex flex-col gap-4">
		<div class="flex flex-col gap-1">
			<label for="write-mail-to" class="text-sm font-medium text-zinc-700">To</label>
			<input
				id="write-mail-to"
				type="email"
				bind:value={to}
				disabled={isLoading}
				required
				placeholder="someone@example.com"
				class="rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
			/>
		</div>

		<div class="flex flex-col gap-1">
			<label for="write-mail-subject" class="text-sm font-medium text-zinc-700">Subject</label>
			<input
				id="write-mail-subject"
				type="text"
				bind:value={subject}
				disabled={isLoading}
				required
				placeholder="Subject"
				class="rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
			/>
		</div>

		<div class="flex flex-col gap-1">
			<label for="write-mail-body" class="text-sm font-medium text-zinc-700">Body</label>
			<textarea
				id="write-mail-body"
				bind:value={body}
				disabled={isLoading}
				placeholder="Write your message..."
				class="h-40 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
			></textarea>
		</div>

		<div class="flex items-center gap-4">
			<button
				type="submit"
				disabled={isLoading}
				class="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
			>
				{#if isLoading}
					<svg
						class="h-4 w-4 animate-spin"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
					>
						<circle
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-opacity="0.25"
							stroke-width="4"
						></circle>
						<path
							d="M4 12a8 8 0 0 1 8-8"
							stroke="currentColor"
							stroke-width="4"
							stroke-linecap="round"
						></path>
					</svg>
				{/if}
				Send
			</button>
		</div>
	</form>

	{#if result}
		<div
			class="flex flex-col gap-1 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900"
		>
			<span class="font-medium">Sent</span>
			{#if result.messageId}
				<span class="break-all text-xs">id: <code>{result.messageId}</code></span>
			{/if}
		</div>
	{/if}

	{#if error}
		<pre
			class="overflow-auto rounded-md border border-red-200 bg-red-50 p-3 text-sm whitespace-pre-wrap text-red-900">{error}</pre>
	{/if}
</div>
