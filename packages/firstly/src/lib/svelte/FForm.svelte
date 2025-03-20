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
	}

	let {
		uid = default_uid,
		r,
		fields,
		customField,
		defaults,
		classes = {
			root: 'form',
			button: 'btn btn-primary',
		},
	}: Props<entityType> = $props()

	let valuesToUse = $state(r.create(defaults))
	let errors = $state<Record<string, string>>({})

	const fieldsToUse = $derived(
		fields ?? r.fields.toArray().filter((c) => c.apiUpdateAllowed(r.item)),
	)

	const onsubmit = async (e: Event) => {
		e.preventDefault()
		try {
			const newItem = await getEntityRef(r.item).save()
			if(newItem){
				r.items?.push(newItem)
			}
			valuesToUse = r.create()
			errors = {}
		} catch (error) {
			if (error instanceof EntityError) {
				errors = error.modelState as Record<string, string>
			}
		}
	}
</script>

<form data-ff-form class={classes?.root} {onsubmit}>
	<div data-ff-form-title>{r.metadata.caption}</div>
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
</form>
