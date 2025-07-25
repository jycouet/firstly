<script lang="ts">
	import { FieldGroup, storeItem } from '../../internals'
	import { cellsBuildor } from '../../internals/cellsBuildor'
	import { dialog, type DialogMetaDataInternal } from './dialog'
	import DialogPrimitive from './DialogPrimitive.svelte'
	import FormEditAction from './FormEditAction.svelte'

	export let toShow: DialogMetaDataInternal

	$: cells = cellsBuildor(toShow.repo!, toShow.cells!)
	$: store = toShow.store ?? storeItem(toShow.repo!)

	$: {
		if (toShow.type === 'update' || toShow.type === 'view') {
			store.set({ item: toShow.defaults, errors: {}, loading: false, globalError: undefined })
		} else {
			store.create(toShow.defaults ?? {})
		}
	}

	const onCreate = (args: { input: string; id: string }) => {
		dialog.close(toShow.id, { success: true, item: args.input })
	}

	let isLoading = false
	const onInsert = async () => {
		isLoading = true
		try {
			const result = await store.save()
			if (result) {
				dialog.close(toShow.id, { success: true, item: result })
			}
		} catch (e) {
			if (toShow.reThrow) {
				throw e
			}
		} finally {
			isLoading = false
		}
	}

	const onDelete = async () => {
		const res = await dialog.confirmDelete('')
		if (res.success) {
			await store.delete()
			dialog.close(toShow.id, { success: true, item: $store.item })
		}
	}
</script>

<DialogPrimitive
	detail={toShow.detail}
	open
	classes={{ root: toShow.classes?.root }}
	on:change={() => dialog.close(toShow.id, { success: false })}
>
	<form on:submit|preventDefault={onInsert}>
		<div class="grid {toShow.classes?.formGrid ?? ''} gap-4 pb-4">
			<FieldGroup
				focusKey={toShow.focusKey}
				{cells}
				{store}
				mode={toShow.type === 'view' ? 'view' : 'edit'}
				createRequest={onCreate}
			/>
		</div>

		<FormEditAction
			type={toShow.type}
			wDelete={toShow.wDelete}
			{store}
			on:delete={onDelete}
			textCreate={toShow.topicPrefixText}
		></FormEditAction>
	</form>
</DialogPrimitive>
