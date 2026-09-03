<script lang="ts">
	import { remult } from 'remult'
	import { errorMessage } from 'firstly'

	import { MailController } from '../MailController'
	import { Roles_Mail } from '../Roles_Mail'

	const hasAccess = $derived(remult.user?.roles?.includes(Roles_Mail.Mail_Admin) ?? false)

	let to = $state('')
	let cc = $state('')
	let bcc = $state('')
	let subject = $state('')
	let body = $state('')
	let isLoading = $state(false)

	let result: { ok: boolean; messageId: string | null } | null = $state(null)
	let error = $state('')

	// Bare-minimum client gate: subject + at least one recipient slot has
	// content. Server splits, trims, lowercases, and validates each entry.
	const canSend = $derived(
		subject.trim().length > 0 && (to.trim() || cc.trim() || bcc.trim()).length > 0,
	)

	async function handleSubmit(e: Event) {
		e.preventDefault()
		if (!canSend) return
		result = null
		error = ''
		isLoading = true
		// We don't gate the request on `hasAccess` (it's a client-only signal):
		// the server cookie-auths via the BackendMethod's `allowed`. The amber
		// notice in the template is for UX only.
		try {
			const r = await MailController.sendTest({ to, cc, bcc, subject, body })
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

<div class="border border-border bg-card text-card-foreground">
	<header class="border-b border-border px-5 py-4">
		<h2 class="text-lg font-semibold text-foreground">Write mail</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Send a test mail through the configured transport.
		</p>
	</header>

	<div class="p-5">
		{#if !hasAccess}
			<div class="border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700">
				You need the
				<code class="bg-amber-500/20 px-1 py-0.5 text-xs text-amber-800">Mail.Admin</code>
				role to use this.
			</div>
		{:else}
			<form onsubmit={handleSubmit} class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<label
						for="write-mail-to"
						class="text-xs font-medium tracking-wide text-muted-foreground uppercase">To</label
					>
					<input
						id="write-mail-to"
						type="text"
						bind:value={to}
						disabled={isLoading}
						placeholder="someone@example.com, other@example.com"
						class="border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none disabled:opacity-50"
					/>
				</div>

				<div class="grid grid-cols-2 gap-4 max-md:grid-cols-1">
					<div class="flex flex-col gap-1">
						<label
							for="write-mail-cc"
							class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Cc</label
						>
						<input
							id="write-mail-cc"
							type="text"
							bind:value={cc}
							disabled={isLoading}
							placeholder="optional, comma-separated"
							class="border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none disabled:opacity-50"
						/>
					</div>
					<div class="flex flex-col gap-1">
						<label
							for="write-mail-bcc"
							class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Bcc</label
						>
						<input
							id="write-mail-bcc"
							type="text"
							bind:value={bcc}
							disabled={isLoading}
							placeholder="optional, comma-separated"
							class="border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none disabled:opacity-50"
						/>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<label
						for="write-mail-subject"
						class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Subject</label
					>
					<input
						id="write-mail-subject"
						type="text"
						bind:value={subject}
						disabled={isLoading}
						required
						placeholder="Subject"
						class="border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none disabled:opacity-50"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label
						for="write-mail-body"
						class="text-xs font-medium tracking-wide text-muted-foreground uppercase">Body</label
					>
					<textarea
						id="write-mail-body"
						bind:value={body}
						disabled={isLoading}
						placeholder="Write your message..."
						class="h-40 w-full border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none disabled:opacity-50"
					></textarea>
				</div>

				<div class="flex items-center gap-4 border-t border-border pt-4">
					<button
						type="submit"
						disabled={isLoading || !canSend}
						class="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
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

					{#if !canSend && !result && !error}
						<span class="text-xs text-muted-foreground"> Add a subject and at least one recipient. </span>
					{/if}

					{#if result}
						<div
							class="flex flex-1 items-center gap-2 border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-700"
						>
							<span class="font-medium">Sent</span>
							{#if result.messageId}
								<code class="ml-auto text-xs break-all">{result.messageId}</code>
							{/if}
						</div>
					{/if}

					{#if error}
						<pre
							class="flex-1 overflow-auto border border-destructive bg-destructive/10 px-3 py-1.5 text-xs whitespace-pre-wrap text-destructive">{error}</pre>
					{/if}
				</div>
			</form>
		{/if}
	</div>
</div>
