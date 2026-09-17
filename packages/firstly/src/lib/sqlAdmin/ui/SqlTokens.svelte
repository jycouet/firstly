<script lang="ts">
	/**
	 * Sql tokens UI: mint, list/revoke, last calls. Styled against the semantic
	 * theme tokens like `<SqlAdmin />`. Server side: `sqlAdmin({ tokens })`.
	 * Revoking is a plain entity update; only `revokedAt` is writable.
	 */
	import { repo } from 'remult'

	import { log } from '../index'
	import { SqlAdminController } from '../SqlAdminController'
	import {
		SQL_TOKEN_CAPS,
		SQL_TOKEN_TTLS,
		SqlToken,
		SqlTokenCall,
		type SqlTokenCap,
		type SqlTokenTtl,
	} from '../sqlTokenEntities'

	type Props = {
		/** Capabilities offered in the form. Others render disabled. @default ['read'] */
		caps?: SqlTokenCap[]
		/** Command shown once a token is minted (what the user pastes). Defaults to a curl line. */
		command?: (token: string) => string
	}
	let { caps: enabledCaps = ['read'], command }: Props = $props()

	const TTLS = Object.keys(SQL_TOKEN_TTLS) as SqlTokenTtl[]
	const defaultCommand = (token: string) =>
		`curl -X POST ${location.origin}/api/ff/sqlAdmin/exec -H "authorization: Bearer ${token}" -H "content-type: application/json" -d '{"args":["select 1"]}'`

	let name = $state('')
	let caps = $state<SqlTokenCap[]>(['read'])
	let ttl = $state<SqlTokenTtl>('1h')
	let minted = $state<string | null>(null)
	let busy = $state(false)
	let error = $state('')
	let copied = $state(false)

	let tokens = $state<SqlToken[]>([])
	let calls = $state<SqlTokenCall[]>([])

	async function refresh() {
		;[tokens, calls] = await Promise.all([
			repo(SqlToken).find({ limit: 100 }),
			repo(SqlTokenCall).find({ limit: 50 }),
		])
	}

	$effect(() => {
		refresh()
	})

	async function mint(e: SubmitEvent) {
		e.preventDefault()
		busy = true
		error = ''
		try {
			minted = await SqlAdminController.mintToken(name, caps, ttl)
			name = ''
			await refresh()
		} catch (err) {
			error = err instanceof Error ? err.message : String(err)
		} finally {
			busy = false
		}
	}

	async function revoke(t: SqlToken) {
		error = ''
		try {
			await repo(SqlToken).update(t.id, { revokedAt: new Date() })
			await refresh()
		} catch (err) {
			error = err instanceof Error ? err.message : String(err)
		}
	}

	function toggleCap(cap: SqlTokenCap, on: boolean) {
		caps = on ? [...new Set([...caps, cap])] : caps.filter((c) => c !== cap)
	}

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text)
			copied = true
			setTimeout(() => (copied = false), 1500)
		} catch (e) {
			log.error('copy failed', e)
		}
	}

	const fmt = (d: Date | null) =>
		d
			? d.toLocaleString(undefined, {
					day: '2-digit',
					month: 'short',
					hour: '2-digit',
					minute: '2-digit',
				})
			: '—'

	const status = (t: SqlToken) =>
		t.revokedAt ? 'revoked' : t.expiresAt.getTime() < Date.now() ? 'expired' : 'live'

	const th = 'px-4 py-2 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase'
	const td = 'px-4 py-2 align-top'
	const btn =
		'border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50'
</script>

<div class="border border-border bg-card text-card-foreground">
	<header class="border-b border-border px-5 py-4">
		<h2 class="text-lg font-semibold text-foreground">SQL Tokens</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			A token is a bag of capabilities that acts as you, for a short while. Minting needs a live
			session - a token can never mint or revoke a token. <code>read</code> runs inside a
			<code>READ ONLY</code> transaction, one statement at a time. Every call is logged below (SQL text,
			rows, ms, error - never the rows themselves). Revoking is immediate.
		</p>
	</header>

	<div class="flex flex-col gap-6 p-5">
		<form onsubmit={mint} class="flex flex-wrap items-end gap-4 text-sm">
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Name</span>
				<input
					bind:value={name}
					required
					placeholder="laptop · claude"
					class="w-56 border border-input bg-background px-2 py-1.5 text-foreground focus:border-ring focus:outline-none"
				/>
			</label>
			<fieldset class="flex flex-col gap-1">
				<legend class="text-xs text-muted-foreground">Capabilities</legend>
				<div class="flex gap-4 py-1.5">
					{#each SQL_TOKEN_CAPS as cap (cap)}
						{@const disabled = !enabledCaps.includes(cap)}
						<label
							class="inline-flex items-center gap-2 select-none"
							class:text-muted-foreground={disabled}
							class:text-destructive={cap === 'write' && caps.includes('write')}
						>
							<input
								type="checkbox"
								checked={caps.includes(cap)}
								{disabled}
								onchange={(e) => toggleCap(cap, e.currentTarget.checked)}
								class={cap === 'write' ? 'accent-destructive' : ''}
							/>
							{cap}{disabled ? ' (off)' : ''}
						</label>
					{/each}
				</div>
			</fieldset>
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Lifetime</span>
				<select
					bind:value={ttl}
					class="border border-input bg-background px-2 py-1.5 text-foreground focus:border-ring focus:outline-none"
				>
					{#each TTLS as t (t)}
						<option value={t}>{t}</option>
					{/each}
				</select>
			</label>
			<button
				type="submit"
				disabled={busy}
				class="bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
			>
				Mint
			</button>
		</form>

		{#if error}
			<pre
				class="border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</pre>
		{/if}

		{#if minted}
			{@const line = (command ?? defaultCommand)(minted)}
			<div class="border border-primary bg-muted p-4 text-sm">
				<p class="text-xs font-medium tracking-wide text-primary uppercase">Shown once - copy it now</p>
				<code class="mt-2 block font-mono break-all select-all">{line}</code>
				<div class="mt-3 flex gap-2">
					<button type="button" class={btn} onclick={() => copy(line)}>
						{copied ? 'Copied' : 'Copy'}
					</button>
					<button type="button" class={btn} onclick={() => (minted = null)}>Dismiss</button>
				</div>
			</div>
		{/if}

		<section>
			<h3 class="mb-2 text-sm font-semibold text-foreground">Tokens</h3>
			<div class="overflow-x-auto border border-border">
				<table class="w-full text-sm">
					<thead class="border-b border-border bg-muted">
						<tr>
							<th class={th}>Name</th>
							<th class={th}>Hint</th>
							<th class={th}>Caps</th>
							<th class={th}>Created</th>
							<th class={th}>Expires</th>
							<th class={th}>Last used</th>
							<th class={th}>Status</th>
							<th class={th}></th>
						</tr>
					</thead>
					<tbody>
						{#each tokens as t (t.id)}
							{@const s = status(t)}
							<tr class="border-b border-border" class:text-muted-foreground={s !== 'live'}>
								<td class={td}>{t.name}</td>
								<td class="{td} font-mono">{t.hint}…</td>
								<td class="{td} font-mono">{t.caps.join(' ')}</td>
								<td class={td}>{fmt(t.createdAt)}</td>
								<td class={td}>{fmt(t.expiresAt)}</td>
								<td class={td}>{fmt(t.lastUsedAt)}</td>
								<td class={td} class:text-primary={s === 'live'}>{s}</td>
								<td class="{td} text-right">
									{#if s === 'live'}
										<button type="button" class={btn} onclick={() => revoke(t)}>Revoke</button>
									{/if}
								</td>
							</tr>
						{:else}
							<tr><td colspan="8" class="px-4 py-6 text-muted-foreground">No token yet.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<section>
			<h3 class="mb-2 text-sm font-semibold text-foreground">Last calls</h3>
			<div class="overflow-x-auto border border-border">
				<table class="w-full text-sm">
					<thead class="border-b border-border bg-muted">
						<tr>
							<th class={th}>When</th>
							<th class={th}>Cap</th>
							<th class={th}>SQL</th>
							<th class={th}>Rows</th>
							<th class={th}>ms</th>
							<th class={th}>Error</th>
						</tr>
					</thead>
					<tbody>
						{#each calls as c (c.id)}
							<tr class="border-b border-border">
								<td class="{td} whitespace-nowrap">{fmt(c.ts)}</td>
								<td class="{td} font-mono">{c.cap}</td>
								<td class={td}><pre class="max-w-2xl font-mono whitespace-pre-wrap">{c.cmd}</pre></td>
								<td class={td}>{c.rowCount}</td>
								<td class={td}>{c.tookMs}</td>
								<td class="{td} text-destructive">{c.error ?? ''}</td>
							</tr>
						{:else}
							<tr><td colspan="6" class="px-4 py-6 text-muted-foreground">No call yet.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	</div>
</div>
