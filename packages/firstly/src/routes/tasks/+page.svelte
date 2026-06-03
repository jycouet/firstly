<script lang="ts">
	import { onMount } from 'svelte'

	import { remult, repo } from 'remult'
	import { stackHttpClient, withHeader } from 'firstly'
	import { EvlogAudit, EvlogStats, EvlogTrace } from 'firstly/evlog'

	import { browser } from '$app/environment'

	import { Task } from '$modules/task/Task'
	import { TaskController } from '$modules/task/TaskController'

	let tasks = $state<Task[]>([])
	let audit = $state<EvlogAudit[]>([])
	let trace = $state<EvlogTrace[]>([])
	let newTitle = $state('')
	let busy = $state(false)
	let demoUser = $state(browser ? (localStorage.getItem('demo-user') ?? 'alice') : 'alice')
	let lastError = $state<{ message: string; why?: string; fix?: string; link?: string } | null>(null)

	// Wire the API client so every outbound call carries the chosen actor.
	if (browser) {
		remult.apiClient.httpClient = stackHttpClient(withHeader('x-demo-user', () => demoUser))
	}

	$effect(() => {
		if (browser) localStorage.setItem('demo-user', demoUser)
	})

	async function refreshAll() {
		;[tasks, audit, trace] = await Promise.all([
			repo(Task).find({ limit: 50 }),
			repo(EvlogAudit).find({ limit: 10 }),
			repo(EvlogTrace).find({ limit: 10 }),
		])
	}

	onMount(refreshAll)

	async function addTask() {
		if (!newTitle.trim()) return
		busy = true
		try {
			await repo(Task).insert({ title: newTitle.trim() })
			newTitle = ''
			await refreshAll()
		} finally {
			busy = false
		}
	}

	async function toggle(t: Task) {
		await repo(Task).save({ ...t, completed: !t.completed })
		await refreshAll()
	}

	async function remove(t: Task) {
		await repo(Task).delete(t.id)
		await refreshAll()
	}

	async function markAll(completed: boolean) {
		busy = true
		try {
			await TaskController.setAllCompleted(completed)
			await refreshAll()
		} finally {
			busy = false
		}
	}

	async function deleteAll() {
		busy = true
		try {
			await TaskController.deleteAll()
			await refreshAll()
		} finally {
			busy = false
		}
	}

	async function triggerError() {
		busy = true
		lastError = null
		try {
			await TaskController.simulateError()
		} catch (err) {
			const e = err as Record<string, unknown>
			lastError = {
				message: String(e.message ?? err),
				why: e.why as string | undefined,
				fix: e.fix as string | undefined,
				link: e.link as string | undefined,
			}
			await refreshAll()
		} finally {
			busy = false
		}
	}
</script>

<svelte:head>
	<title>Tasks - evlog demo</title>
</svelte:head>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
	<section class="rounded-lg border border-border bg-card shadow-sm">
		<div class="flex flex-col gap-3 p-5">
			<h2 class="text-lg font-semibold text-foreground">Tasks</h2>

			<label class="flex w-full flex-col gap-1">
				<span class="text-xs text-muted-foreground"
					>Acting as (sent via <code>x-demo-user</code> header)</span
				>
				<input
					class="rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
					bind:value={demoUser}
				/>
			</label>

			<form
				class="flex w-full"
				onsubmit={(e) => {
					e.preventDefault()
					addTask()
				}}
			>
				<input
					class="w-full rounded-l-md border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
					placeholder="What needs doing?"
					bind:value={newTitle}
					disabled={busy}
				/>
				<button
					class="rounded-r-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
					type="submit"
					disabled={busy || !newTitle.trim()}
				>
					Add
				</button>
			</form>

			<div class="mt-4 flex flex-wrap gap-2">
				<button
					class="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
					disabled={busy}
					onclick={() => markAll(true)}
				>
					Mark all done
				</button>
				<button
					class="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
					disabled={busy}
					onclick={() => markAll(false)}
				>
					Mark all open
				</button>
				<button
					class="inline-flex items-center rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
					disabled={busy}
					onclick={deleteAll}
				>
					Delete all
				</button>
				<button
					class="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
					disabled={busy}
					onclick={triggerError}
				>
					Trigger error
				</button>
				<button
					class="ml-auto inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
					onclick={refreshAll}>Refresh</button
				>
			</div>

			{#if lastError}
				<div
					class="mt-3 flex flex-col items-start gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
				>
					<div class="font-bold">{lastError.message}</div>
					{#if lastError.why}<div><b>Why:</b> {lastError.why}</div>{/if}
					{#if lastError.fix}<div><b>Fix:</b> {lastError.fix}</div>{/if}
					{#if lastError.link}<a
							class="underline hover:no-underline"
							href={lastError.link}
							target="_blank">{lastError.link}</a
						>{/if}
				</div>
			{/if}

			<ul class="mt-4 divide-y divide-border">
				{#each tasks as t (t.id)}
					<li class="flex items-center gap-3 py-2">
						<input
							type="checkbox"
							class="size-4 rounded border-input"
							checked={t.completed}
							onchange={() => toggle(t)}
						/>
						<span class:line-through={t.completed} class="grow text-sm">{t.title}</span>
						<button
							class="inline-flex items-center rounded px-2 py-0.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
							onclick={() => remove(t)}>x</button
						>
					</li>
				{:else}
					<li class="py-4 text-sm text-muted-foreground">No tasks yet.</li>
				{/each}
			</ul>
		</div>
	</section>

	<section class="rounded-lg border border-border bg-card shadow-sm">
		<div class="flex flex-col gap-3 p-5">
			<h2 class="text-lg font-semibold text-foreground">Audit (last 10)</h2>
			<p class="text-xs text-muted-foreground">
				Persisted via the evlog audit drain into <code>_ff_evlog_audit</code>.
			</p>
			<div class="overflow-x-auto">
				<table
					class="w-full text-left text-xs [&_td]:border-b [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-medium [&_th]:text-muted-foreground"
				>
					<thead>
						<tr>
							<th>time</th>
							<th>action</th>
							<th>module</th>
							<th>actor</th>
							<th>target</th>
							<th>changes</th>
						</tr>
					</thead>
					<tbody>
						{#each audit as a (a.id)}
							<tr>
								<td class="whitespace-nowrap">{a.timestamp.toISOString().slice(11, 19)}</td>
								<td><code>{a.action}</code></td>
								<td
									><span
										class="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
										>{a.module ?? '-'}</span
									></td
								>
								<td>{a.actorId}</td>
								<td class="max-w-[10ch] truncate font-mono text-[10px]">{a.targetId}</td>
								<td class="max-w-xs truncate font-mono text-[10px]">
									{JSON.stringify(a.changes)}
								</td>
							</tr>
						{:else}
							<tr><td colspan="6" class="text-center text-muted-foreground">No audit yet.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>

			<h2 class="mt-4 text-lg font-semibold text-foreground">Trace (last 10)</h2>
			<p class="text-xs text-muted-foreground">
				Request wide events into <code>_ff_evlog_trace</code> (queries from <code>db_queries[]</code>).
			</p>
			<div class="overflow-x-auto">
				<table
					class="w-full text-left text-xs [&_td]:border-b [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-medium [&_th]:text-muted-foreground"
				>
					<thead>
						<tr>
							<th>time</th>
							<th>src</th>
							<th>method</th>
							<th>path</th>
							<th>status</th>
							<th>ms</th>
							<th>SQL</th>
						</tr>
					</thead>
					<tbody>
						{#each trace as r (r.id)}
							{@const ev = r.event as Record<string, unknown>}
							{@const queries = ev?.db_queries as unknown[] | undefined}
							{@const errored = r.level === 'error' || (r.status ?? 0) >= 400}
							<tr class={errored ? 'bg-destructive/10 text-destructive' : ''}>
								<td class="whitespace-nowrap">{r.timestamp.toISOString().slice(11, 19)}</td>
								<td>
									<span
										class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium {r.source ===
										'client'
											? 'bg-primary text-primary-foreground'
											: 'bg-muted text-muted-foreground'}"
									>
										{r.source}
									</span>
								</td>
								<td>{r.method ?? '-'}</td>
								<td class="max-w-xs truncate">{r.path ?? r.operation ?? '-'}</td>
								<td>{r.status ?? '-'}</td>
								<td>{r.duration?.toFixed?.(0) ?? '-'}</td>
								<td>
									{#if queries?.length}
										<span
											class="inline-flex items-center rounded bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-foreground"
											>{queries.length}</span
										>
									{:else}
										<span class="text-muted-foreground">-</span>
									{/if}
								</td>
							</tr>
						{:else}
							<tr><td colspan="7" class="text-center text-muted-foreground">No trace yet.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</section>
</div>

<section class="mt-6 rounded-lg border border-border bg-card shadow-sm">
	<div class="flex flex-col gap-3 p-5">
		<EvlogStats />
	</div>
</section>
