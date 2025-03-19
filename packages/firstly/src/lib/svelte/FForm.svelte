<script lang="ts" generics="entityType = unknown">
	import { EntityError, getEntityRef, remult, type FieldMetadata } from 'remult'

	import type { FF_Repo } from './FF_Repo.svelte'
	import FField from './FField.svelte'

	const default_uid = $props.id()

	interface Props<entityType> {
		uid?: string
		r: FF_Repo<entityType>
		fields?: FieldMetadata<unknown, entityType>[]
			customField?: import('svelte').Snippet<[{ field: FieldMetadata<unknown, entityType>, value: unknown }]>

		classes?: {
			root?: string
			button?: string
		}
	}

	let {
		uid = default_uid,
		r,
		fields = r.repo.fields.toArray().filter((c) => c.apiUpdateAllowed()),
		customField,
		classes = {
			root: 'form',
			button: 'btn btn-primary',
		},
	}: Props<entityType> = $props()

	let values = $state(r.repo.create())
	let errors = $state<Record<string, string>>({})

	const onsubmit = async (e: Event) => {
		e.preventDefault()
		try {
			const newItem = await getEntityRef(values).save()
			// TODO: should I add to list now ?
			r.items?.push(newItem)
			values = r.repo.create()
			errors = {}
		} catch (error) {
			if (error instanceof EntityError) {
				errors = error.modelState as Record<string, string>
			}
		}
	}
</script>

<form data-ff-form class={classes?.root} {onsubmit}>
	<span data-ff-form-fields>
		{#each fields as field}
			<FField
				uid="{uid}-{field.key}"
				{field}
				bind:value={values[field.key as keyof entityType]}
				error={errors[field.key]}
				{customField}
			/>
		{/each}
	</span>
	<button data-ff-form-button class={classes?.button} disabled={!r.repo.metadata.apiInsertAllowed()}>
		Add
	</button>
</form>
