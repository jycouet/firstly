<script lang="ts" generics="entityType = unknown">
	import { EntityError, getEntityRef, remult, type FieldMetadata } from 'remult'

	import type { CustomFieldSnippet } from './createCustomField'
	import type { FF_Repo } from './FF_Repo.svelte'
	import FField from './FField.svelte'

	const default_uid = $props.id()

	interface Props<entityType> {
		uid?: string
		r: FF_Repo<entityType>
		fields?: FieldMetadata<unknown, entityType>[]
		customField?: CustomFieldSnippet<unknown, entityType>
		defaults?: Partial<entityType>
		classes?: {
			root?: string
			button?: string
		}
		show?: {
			title?: boolean
		}
		onSaved?: (item: entityType) => void
	}

	let {
		uid = default_uid,
		r,
		fields,
		customField,
		defaults,
		show = {
			title: true,
		},
		classes = {
			root: 'form',
			button: 'btn btn-primary',
		},
		onSaved,
	}: Props<entityType> = $props()

	let valuesToUse = $state(r.item ? r.item : r.create(defaults)) as entityType
	let errors = $state<Record<string, string>>({})
	let globalError = $state<string | undefined>(undefined)
	const fieldsToUse = $derived(
		fields ?? r.fields.toArray().filter((c) => c.apiUpdateAllowed(r.item)),
	)

	const onsubmit = async (e: Event) => {
		e.preventDefault()
		globalError = undefined
		try {
			const ref = getEntityRef(valuesToUse)
			const wasNew = ref.isNew()			
			const itemSaved = await ref.save()
			if(wasNew){
				if(itemSaved){
					r.items?.unshift(itemSaved)
				}
				if(r.aggregates && r.aggregates.$count !== undefined){
					r.aggregates.$count = r.aggregates.$count + 1
				}
				valuesToUse = r.create()
			}
			if(itemSaved){
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
	}
</script>

<form data-ff-form class={classes?.root} {onsubmit}>
	{#if show?.title}
		<div data-ff-form-title>{r.metadata.caption}</div>
	{/if}
	<div data-ff-form-fields>
		{#each fieldsToUse as field}
				<FField
					uid="{uid}-{field.key}"
					{field}
					bind:value={valuesToUse[field.key as keyof entityType]}
					error={errors[field.key]}
					{customField}
				/>
		{/each}
	</div>
	<button data-ff-form-button class={classes?.button} disabled={!r.metadata.apiInsertAllowed()}>
		Add
	</button>
	{globalError}
</form>
