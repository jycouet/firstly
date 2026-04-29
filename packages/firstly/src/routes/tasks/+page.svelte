<script lang="ts">
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { remult, repo } from 'remult'
	import { stackHttpClient, withHeader } from 'firstly'

	import { Task } from '$modules/task/Task'
	import { TaskController } from '$modules/task/TaskController'
	import { EvlogAudit, EvlogStats, EvlogTrace } from 'firstly/evlog'

	let tasks = $state<Task[]>([])
	let audit = $state<EvlogAudit[]>([])
	let trace = $state<EvlogTrace[]>([])
	let newTitle = $state('')
	let busy = $state(false)
	let demoUser = $state(browser ? localStorage.getItem('demo-user') ?? 'alice' : 'alice')
	let lastError = $state<{ message: string; why?: string; fix?: string; link?: string } | null>(
		null,
	)

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
	<section class="card bg-base-100 shadow">
		<div class="card-body">
			<h2 class="card-title">Tasks</h2>

			<label class="form-control w-full">
				<span class="label-text text-xs">Acting as (sent via <code>x-demo-user</code> header)</span>
				<input class="input input-bordered input-sm" bind:value={demoUser} />
			</label>

			<form
				class="join w-full"
				onsubmit={(e) => {
					e.preventDefault()
					addTask()
				}}
			>
				<input
					class="input input-bordered join-item w-full"
					placeholder="What needs doing?"
					bind:value={newTitle}
					disabled={busy}
				/>
				<button class="btn btn-primary join-item" type="submit" disabled={busy || !newTitle.trim()}>
					Add
				</button>
			</form>

			<div class="mt-4 flex flex-wrap gap-2">
				<button class="btn btn-sm" disabled={busy} onclick={() => markAll(true)}>
					Mark all done
				</button>
				<button class="btn btn-sm" disabled={busy} onclick={() => markAll(false)}>
					Mark all open
				</button>
				<button class="btn btn-sm btn-error" disabled={busy} onclick={deleteAll}>
					Delete all
				</button>
				<button class="btn btn-sm btn-warning" disabled={busy} onclick={triggerError}>
					Trigger error
				</button>
				<button class="btn btn-sm btn-ghost ml-auto" onclick={refreshAll}>Refresh</button>
			</div>

			{#if lastError}
				<div class="alert alert-error mt-3 flex flex-col items-start text-xs">
					<div class="font-bold">{lastError.message}</div>
					{#if lastError.why}<div><b>Why:</b> {lastError.why}</div>{/if}
					{#if lastError.fix}<div><b>Fix:</b> {lastError.fix}</div>{/if}
					{#if lastError.link}<a class="link" href={lastError.link} target="_blank">{lastError.link}</a>{/if}
				</div>
			{/if}

			<ul class="mt-4 divide-y divide-base-300">
				{#each tasks as t (t.id)}
					<li class="flex items-center gap-3 py-2">
						<input
							type="checkbox"
							class="checkbox checkbox-sm"
							checked={t.completed}
							onchange={() => toggle(t)}
						/>
						<span class:line-through={t.completed} class="grow text-sm">{t.title}</span>
						<button class="btn btn-xs btn-ghost" onclick={() => remove(t)}>x</button>
					</li>
				{:else}
					<li class="py-4 text-sm text-base-content/60">No tasks yet.</li>
				{/each}
			</ul>
		</div>
	</section>

	<section class="card bg-base-100 shadow">
		<div class="card-body">
			<h2 class="card-title">Audit (last 10)</h2>
			<p class="text-xs text-base-content/60">Persisted via the evlog audit drain into <code>_ff_evlog_audit</code>.</p>
			<div class="overflow-x-auto">
				<table class="table table-xs">
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
								<td><span class="badge badge-ghost badge-xs">{a.module ?? '-'}</span></td>
								<td>{a.actorId}</td>
								<td class="max-w-[10ch] truncate font-mono text-[10px]">{a.targetId}</td>
								<td class="max-w-xs truncate font-mono text-[10px]">
									{JSON.stringify(a.changes)}
								</td>
							</tr>
						{:else}
							<tr><td colspan="6" class="text-center text-base-content/60">No audit yet.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>

			<h2 class="card-title mt-4">Trace (last 10)</h2>
			<p class="text-xs text-base-content/60">Request wide events into <code>_ff_evlog_trace</code> (queries from <code>db_queries[]</code>).</p>
			<div class="overflow-x-auto">
				<table class="table table-xs">
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
							<tr class:bg-error={errored} class:text-error-content={errored}>
								<td class="whitespace-nowrap">{r.timestamp.toISOString().slice(11, 19)}</td>
								<td>
									<span
										class="badge badge-xs"
										class:badge-primary={r.source === 'client'}
										class:badge-ghost={r.source !== 'client'}
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
										<span class="badge badge-info badge-xs">{queries.length}</span>
									{:else}
										<span class="text-base-content/40">-</span>
									{/if}
								</td>
							</tr>
						{:else}
							<tr><td colspan="7" class="text-center text-base-content/60">No trace yet.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</section>
</div>

<section class="mt-6 card bg-base-100 shadow">
	<div class="card-body">
		<EvlogStats />
	</div>
</section>
