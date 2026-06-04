<script lang="ts" generics="T extends object">
	// Boutique bound-record group — a single record shown as an editable form (or readonly view).
	// A "group" that becomes a form when editing. Reuses the shared GroupFields body.
	import type { ClassType, EntityFilter } from 'remult'

	import { type CellInput, dialog, ff } from 'firstly/svelte'

	import GroupFields from './GroupFields.svelte'

	type Props = {
		entity: ClassType<T>
		/** Field descriptors (terse key or config). Defaults to visible fields. */
		selected?: CellInput<T>[]
		where?: EntityFilter<T>
		/** 'edit' (inputs + Save/Delete) or 'readonly' (values only). */
		mode?: 'edit' | 'readonly'
		onsaved?: (saved: T) => void
		/** Show Delete but disabled (pure UI). */
		disableDelete?: boolean
	}
	let { entity, selected, where, mode = 'edit', onsaved, disableDelete = false }: Props = $props()

	const r = ff(entity).one(() => ({ where }))

	let errors = $state<Record<string, string | undefined>>({})
	let formError = $state('')

	async function save() {
		try {
			const saved = await r.save()
			errors = {}
			formError = ''
			onsaved?.(saved)
		} catch (err) {
			// per-field errors come from modelState (shown beside each field); only surface a
			// form-level message for errors that aren't tied to a field.
			const ms = (err as { modelState?: Record<string, string> })?.modelState
			errors = ms ?? {}
			formError = ms ? '' : err instanceof Error ? err.message : String(err)
		}
	}
	async function del() {
		const res = await dialog.confirm('Delete this record?', { danger: true })
		if (res.ok) await r.delete()
	}
</script>

{#if r.loading.init}
	<p data-ff-form-loading>…</p>
{:else if r.item}
	<GroupFields
		meta={r.meta}
		draft={r.item}
		{selected}
		{mode}
		{errors}
		error={formError}
		busy={r.isWriting}
		canSave={r.meta.apiUpdateAllowed(r.item)}
		onsave={save}
		ondelete={del}
		{disableDelete}
	/>
{:else}
	<button data-ff-form-new disabled={!r.meta.apiInsertAllowed()} onclick={() => r.create()}>
		+ New
	</button>
{/if}
