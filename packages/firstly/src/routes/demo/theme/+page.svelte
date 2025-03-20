<script lang="ts">
	import { Task } from '$modules/task/Task'
	import EditCustom from '$modules/task/ui/EditCustom.svelte'
	import { FF_Form, FF_Grid, FF_Repo, mergeFieldMetadata } from '$lib/svelte'

	const r = new FF_Repo(Task, {
		queryOptions: {
			// skipAutoFetch: true,
			// pageSize: 1,
			aggregate: {
				distinctCount: ['title', 'id'],
			},
		},
	})

	// Set up fields with different widths
	const fields = [
		mergeFieldMetadata(r.fields.title, {
			ui: {
				position: { span: 2 },
				customField: {
					edit: EditCustom,
				},
			},
		}),
		mergeFieldMetadata(r.fields.typeOfTask, { ui: { position: { span: 6, mobile: { span: 12 } } } }),
		mergeFieldMetadata(r.fields.size, { ui: { position: { span: 3 } } }),
	]
</script>

<div class="flex flex-col gap-1">
	<!-- <FForm {r} {fields}> -->
	<FF_Form {r} {fields}>
		<!-- {#snippet customField({ field, value })}
			{#if field.key === 'title'}
				title stuff... {field.key}
				<EditCustom {field} {value} mode="edit" />
			{/if}
		{/snippet} -->
	</FF_Form>
	<hr />
	<h2 class="text-2xl">Default Grid (Edit and Delete)</h2>
	<FF_Grid {r} />
</div>
