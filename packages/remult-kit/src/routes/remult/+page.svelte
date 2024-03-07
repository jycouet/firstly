<script lang="ts">
	import { remult } from 'remult'

	import { EachFields, kitCellsBuildor, kitStoreItem, UIEntity } from '$lib'

	const repo = remult.repo(UIEntity)

	const cells = kitCellsBuildor(repo)([
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

	const store = kitStoreItem(repo)
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
		<EachFields {cells} {store} mode={isEdit ? 'edit' : 'view'} />
	</div>
</form>
