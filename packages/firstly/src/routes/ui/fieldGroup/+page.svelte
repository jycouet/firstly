<script lang="ts">
	import { repo } from 'remult'

	import { cellsBuildor, FieldGroup, storeItem, UIEntity } from '$lib/internals'

	const repoUi = repo(UIEntity)

	const cells = cellsBuildor(repoUi, [
		'state',
		'id',
		'createdAt',
		'updatedAt',
		'username',
		'email',
		'password',
		'permissions',
		'cuid',
		'isSubContractor',
		'rate',
		'arrivalDate',
		'arrivalDateOnly',
	])

	const store = storeItem(repoUi)
	$: store.fetch(-1)

	let isEdit = true
</script>

<form>
	<button
		on:click={() => {
			isEdit = !isEdit
		}}
		class="btn btn-primary">Edit</button
	>
	<div class="grid grid-cols-3 gap-4">
		<FieldGroup {cells} {store} mode={isEdit ? 'edit' : 'view'} />
	</div>
</form>
