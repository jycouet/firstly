<script lang="ts">
	import { dialog } from 'firstly/svelte'

	import DemoOpen from './DemoOpen.svelte'

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
	async function openOpen() {
		const r = await dialog.open(DemoOpen, { props: { name: 'Ada' }, width: 'md' })
		lastResult = r.ok ? `open -> ${JSON.stringify(r.data)}` : 'open -> dismissed'
	}
	async function openConfirm() {
		const { ok } = await dialog.confirm('Save the changes?', { title: 'Confirm' })
		lastResult = `confirm -> ${ok}`
	}
	async function openDanger() {
		const { ok } = await dialog.confirm('Delete this item? This cannot be undone.', {
			title: 'Delete',
			danger: true,
			confirmLabel: 'Delete',
		})
		lastResult = `confirm(danger) -> ${ok}`
	}
	async function openPrompt() {
		const r = await dialog.prompt({ title: 'Your name', label: 'Name', placeholder: 'Ada Lovelace' })
		lastResult = r.ok ? `prompt -> ${JSON.stringify(r.data)}` : 'prompt -> cancelled'
	}
	async function openPromptHint() {
		const r = await dialog.prompt({
			title: 'New option',
			label: 'Label',
			placeholder: 'My option',
			hint: (val) => `key: ${slug(val) || '—'}`,
		})
		lastResult = r.ok ? `prompt(hint) -> ${JSON.stringify(r.data)}` : 'prompt(hint) -> cancelled'
	}
</script>

{#snippet formBody(close: (r?: { ok: true; data: unknown } | { ok: false }) => void)}
	<h2 class="mb-3 text-lg font-semibold">Custom dialog (show)</h2>
	<p class="mb-3 text-sm text-muted-foreground">
		<code>show(body)</code> renders any snippet and resolves <code>{`{ ok, data }`}</code>.
	</p>
	<input
		bind:value={name}
		placeholder="Type something"
		class="mb-4 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
	/>
	<div class="flex justify-end gap-2">
		<button
			class="rounded-md border border-border px-3 py-1.5 text-sm"
			onclick={async () => {
				const { ok } = await dialog.confirm('Opened on top of the dialog.', { title: 'Nested' })
				lastResult = `nested confirm -> ${ok}`
			}}
		>
			Nested confirm
		</button>
		<button
			class="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
			onclick={() => close({ ok: true, data: { name } })}
		>
			OK
		</button>
	</div>
{/snippet}

<div class="max-w-2xl">
	<p class="mb-4 text-sm text-muted-foreground">
		Every dialog renders through one <code>&lt;FF_DialogManager /&gt;</code> with built-in, theme-adaptive
		defaults. Open any:
	</p>
	<div class="flex flex-wrap gap-2">
		<button
			class="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
			onclick={openShow}
		>
			show (custom body)
		</button>
		<button
			class="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
			onclick={openOpen}
		>
			open (component)
		</button>
		<button
			class="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
			onclick={openConfirm}
		>
			confirm
		</button>
		<button
			class="rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground"
			onclick={openDanger}
		>
			confirm (danger)
		</button>
		<button
			class="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
			onclick={openPrompt}
		>
			prompt
		</button>
		<button
			class="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
			onclick={openPromptHint}
		>
			prompt (hint)
		</button>
	</div>
	<p class="mt-6 text-sm text-muted-foreground">Last result:</p>
	<pre class="mt-1 rounded-md bg-muted p-3 text-sm">{lastResult}</pre>
</div>
