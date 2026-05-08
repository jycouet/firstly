<script lang="ts">
	import { remult } from 'remult'
	import { errorMessage } from 'firstly'

	import { MailController } from '../MailController'
	import { Roles_Mail } from '../Roles_Mail'

	const hasAccess = $derived(remult.user?.roles?.includes(Roles_Mail.Mail_Admin) ?? false)

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
		// We don't gate the request on `hasAccess` (it's a client-only signal):
		// the server cookie-auths via the BackendMethod's `allowed`. The amber
		// notice in the template is for UX only.
		try {
			const r = await MailController.sendTest({ to, subject, body })
			if (r.ok) {
				result = { ok: true, messageId: r.messageId }
			} else {
				error = r.error ?? 'Unknown error'
			}
		} catch (e) {
			error = errorMessage(e)
		} finally {
			isLoading = false
		}
	}
</script>

<div class="border border-zinc-800 bg-zinc-900 text-zinc-200">
	<header class="border-b border-zinc-800 px-5 py-4">
		<h2 class="text-lg font-semibold text-zinc-100">Write mail</h2>
		<p class="mt-1 text-sm text-zinc-400">Send a test mail through the configured transport.</p>
	</header>

	<div class="p-5">
		{#if !hasAccess}
			<div class="border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
				You need the
				<code class="bg-amber-500/20 px-1 py-0.5 text-xs text-amber-100">Mail.Admin</code>
				role to use this.
			</div>
		{:else}
			<form onsubmit={handleSubmit} class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<label for="write-mail-to" class="text-xs font-medium tracking-wide text-zinc-400 uppercase"
						>To</label
					>
					<input
						id="write-mail-to"
						type="email"
						bind:value={to}
						disabled={isLoading}
						required
						placeholder="someone@example.com"
						class="border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-400 focus:outline-none disabled:opacity-50"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label
						for="write-mail-subject"
						class="text-xs font-medium tracking-wide text-zinc-400 uppercase">Subject</label
					>
					<input
						id="write-mail-subject"
						type="text"
						bind:value={subject}
						disabled={isLoading}
						required
						placeholder="Subject"
						class="border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-400 focus:outline-none disabled:opacity-50"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="write-mail-body" class="text-xs font-medium tracking-wide text-zinc-400 uppercase"
						>Body</label
					>
					<textarea
						id="write-mail-body"
						bind:value={body}
						disabled={isLoading}
						placeholder="Write your message..."
						class="h-40 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-400 focus:outline-none disabled:opacity-50"
					></textarea>
				</div>

				<div class="flex items-center gap-4 border-t border-zinc-800 pt-4">
					<button
						type="submit"
						disabled={isLoading}
						class="inline-flex items-center gap-2 bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
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
						Send
					</button>

					{#if result}
						<div
							class="flex flex-1 items-center gap-2 border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-200"
						>
							<span class="font-medium">Sent</span>
							{#if result.messageId}
								<code class="ml-auto text-xs break-all">{result.messageId}</code>
							{/if}
						</div>
					{/if}

					{#if error}
						<pre
							class="flex-1 overflow-auto border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs whitespace-pre-wrap text-red-200">{error}</pre>
					{/if}
				</div>
			</form>
		{/if}
	</div>
</div>
