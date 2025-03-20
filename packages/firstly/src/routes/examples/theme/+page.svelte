<script lang="ts">
	import { Task } from '$modules/task/Task'
	import { FF_Repo, FF_Form, FF_Grid } from '$lib/svelte'
	import { mergeFieldMetadata } from '$lib/svelte/mergeFieldMetadata'

	const r = new FF_Repo(Task, {
		queryOptions: {
			// skipAutoFetch: true,
			pageSize: 1,
			aggregate: {
				distinctCount: ['title', 'id'],
			},
		},
	})

	// Set up fields with different widths
	const fields = [
		mergeFieldMetadata(r.fields.title, { ui: { position: { span: 12 } } }),
		mergeFieldMetadata(r.fields.title, { ui: { position: { span: 6, mobile: { span: 12 } } } }),
		mergeFieldMetadata(r.fields.title, { ui: { position: { span: 3 } } }),
	]
</script>


	<div class="flex flex-col gap-1">
		<!-- <FForm {r} {fields}> -->
		<FF_Form {r}>
			<!-- {#snippet customField(field, value)}
		{#if field.key === 'title'}
			title stuff... 
		{/if}
	{/snippet} -->
		</FF_Form>
		<hr />
		<h2 class="text-2xl">Default Grid (Edit and Delete)</h2>
		<FF_Grid {r} />
	</div>
