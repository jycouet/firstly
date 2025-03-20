<script lang="ts">
	import { Task } from '$modules/task/Task'
	import { FF_Repo, FForm, FGrid } from '$lib/svelte'
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
		<FForm {r}>
			<!-- {#snippet customField(field, value)}
		{#if field.key === 'title'}
			title stuff... 
		{/if}
	{/snippet} -->
		</FForm>
		<hr />
		<h2 class="text-2xl">Default Grid (Edit and Delete)</h2>
		<FGrid {r} />
	</div>
