<script lang="ts" generics="entityType = unknown">
	import { EntityError, getEntityRef } from 'remult'

	import { FF_Field, getClasses } from './'
	import type { FF_Repo, FieldGroup, FormTheme } from './'

	const default_uid = $props.id()

	interface Props<entityType> {
		uid_prefix?: string
		uid?: string
		r: FF_Repo<entityType>
		groups?: FieldGroup<entityType>[]
		defaults?: Partial<entityType>
		classes?: FormTheme
		show?: {
			title?: boolean
		}
		onSaved?: (item: entityType) => void
	}

	let {
		uid_prefix = '',
		uid = default_uid,
		r,
		groups,
		defaults,
		show = {
			title: true,
		},
		classes: localClasses = {},
		onSaved,
	}: Props<entityType> = $props()

	const ToUse = uid_prefix ? `${uid_prefix}-${uid}` : uid

	let classes = $derived(getClasses('form', localClasses))

	let errors = $state<Record<string, string>>({})
	let globalError = $state<string | undefined>(undefined)

	let valuesToUse = $state(r.item ? r.item : r.create(defaults))
	let ref = $derived(getEntityRef(valuesToUse))
	const groupsToUse: FieldGroup<entityType>[] = $derived(groups ?? r.getLayout()?.groups ?? [])

	const onsubmit = async (e: Event) => {
		e.preventDefault()
		// r.loading.saving = true
		// 		FF_Form.svelte:48 [svelte] ownership_invalid_mutation
		// src/lib/svelte/FF_Form.svelte mutated a value owned by src/routes/demo/FF_Simple/+page.svelte. This is strongly discouraged. Consider passing values to child components with `bind:`, or use a callback instead
		// https://svelte.dev/e/ownership_invalid_mutation
		globalError = undefined
		try {
			if (ref.isNew()) {
				const itemSaved = await ref.save()
				r.items?.unshift(itemSaved)
				if (r.aggregates && r.aggregates.$count !== undefined) {
					r.aggregates.$count = r.aggregates.$count + 1
				}
				valuesToUse = r.create()
				onSaved?.(itemSaved)
			} else {
				const itemSaved = await ref.save()
				onSaved?.(itemSaved)
			}
			errors = {}
		} catch (error) {
			if (error instanceof EntityError) {
				errors = error.modelState as Record<string, string>
			} else {
				// @ts-ignore
				globalError = error.message
			}
		}
		// r.loading.saving = false
	}
</script>

<form data-ff-form class="{classes?.root} {r.metadata.key}" {onsubmit}>
	<div data-ff-form-groups class={classes?.groups}>
		{#each groupsToUse ?? [] as group (group.key)}
			<div data-ff-form-group>
				{#if show?.title}
					<div data-ff-form-title>
						<!-- {ref.isNew() ? 'Add' : 'Save'} -->
						{group?.caption ?? r.metadata.caption}
					</div>
				{/if}
				{#if group?.hint}
					<div data-ff-form-hint>{@html group?.hint}</div>
				{/if}
				<div data-ff-form-fields class="{classes?.fields} {group.class}">
					{#each group.fields as field}
						<FF_Field
							uid="{ToUse}-{field.key}"
							{field}
							bind:value={valuesToUse[field.key as keyof entityType]}
							error={errors[field.key]}
						/>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div data-ff-form-actions class={classes?.actions}>
		<button
			data-ff-form-button
			class={classes?.submitButton}
			disabled={!r.metadata.apiInsertAllowed() || r.loading.saving}
		>
			{ref.isNew() ? 'Add' : 'Save'}{r.loading.saving ? '...' : ''}
		</button>
		{globalError}
	</div>
	{globalError}
	<!-- TODO: display errors of field not in the form -->
</form>

<style>
	[data-ff-form-title] {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		padding: var(--ff-spacing);
	}

	[data-ff-form-hint] {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		padding: var(--ff-spacing);
	}

	[data-ff-form-fields] {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
	}

	/* To distribute as default css ? */
	.ff-form-actions {
		display: flex;
		justify-content: flex-end;
		margin: 1rem;

		button {
			border-radius: 0.5rem;
			padding: 0.5rem 1rem;
			background-color: green;
			color: #fff;
			border: none;
			cursor: pointer;
		}
	}
</style>
