<script lang="ts">
	import { dialog } from 'firstly/svelte'

	let lastResult = $state('—')
	let name = $state('')

	const slug = (s: string) =>
		s
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')

	async function openShow() {
		const r = await dialog.show(formBody, { width: 'md' })
		lastResult = r.ok ? `show -> ${JSON.stringify(r.data)}` : 'show -> dismissed'
	}
	async function openConfirm() {
		const ok = await dialog.confirm('Save the changes?', { title: 'Confirm' })
		lastResult = `confirm -> ${ok}`
	}
	async function openDanger() {
		const ok = await dialog.confirm('Delete this item? This cannot be undone.', {
			title: 'Delete',
			danger: true,
			confirmLabel: 'Delete',
		})
		lastResult = `confirm(danger) -> ${ok}`
	}
	async function openPrompt() {
		const v = await dialog.prompt({ title: 'Your name', label: 'Name', placeholder: 'Ada Lovelace' })
		lastResult = `prompt -> ${v === null ? 'cancelled' : JSON.stringify(v)}`
	}
	async function openPromptHint() {
		const v = await dialog.prompt({
			title: 'New option',
			label: 'Label',
			placeholder: 'My option',
			hint: (val) => `key: ${slug(val) || '—'}`,
		})
		lastResult = `prompt(hint) -> ${v === null ? 'cancelled' : JSON.stringify(v)}`
	}
</script>

{#snippet formBody(close: (r?: { ok: true; data: unknown } | { ok: false }) => void)}
	<h2 class="mb-3 text-lg font-semibold">Custom dialog (show)</h2>
	<p class="text-muted-foreground mb-3 text-sm">
		<code>show(body)</code> renders any snippet and resolves <code>{`{ ok, data }`}</code>.
	</p>
	<input
		bind:value={name}
		placeholder="Type something"
		class="border-border bg-card mb-4 w-full rounded-md border px-3 py-2 text-sm"
	/>
	<div class="flex justify-end">
		<button
			class="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm"
			onclick={() => close({ ok: true, data: { name } })}
		>
			OK
		</button>
	</div>
{/snippet}

<div class="max-w-2xl">
	<p class="text-muted-foreground mb-4 text-sm">
		Every dialog renders through one <code>&lt;FF_DialogManager /&gt;</code> with built-in, theme-adaptive
		defaults. Open any:
	</p>
	<div class="flex flex-wrap gap-2">
		<button
			class="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium"
			onclick={openShow}
		>
			show (custom body)
		</button>
		<button
			class="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium"
			onclick={openConfirm}
		>
			confirm
		</button>
		<button
			class="bg-destructive text-destructive-foreground rounded-md px-3 py-2 text-sm font-medium"
			onclick={openDanger}
		>
			confirm (danger)
		</button>
		<button
			class="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium"
			onclick={openPrompt}
		>
			prompt
		</button>
		<button
			class="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium"
			onclick={openPromptHint}
		>
			prompt (hint)
		</button>
	</div>
	<p class="text-muted-foreground mt-6 text-sm">Last result:</p>
	<pre class="bg-muted mt-1 rounded-md p-3 text-sm">{lastResult}</pre>
</div>
