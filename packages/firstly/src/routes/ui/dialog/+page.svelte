<script lang="ts">
	import { Button } from '$lib/internals'
	import { dialog } from '$lib/ui/dialog/dialog'

	import DemoDialog from './DemoDialog.svelte'
</script>

<div class="grid grid-cols-3 gap-4">
	<div>
		<Button
			onclick={async () => {
				const result1 = await dialog.show({ component: DemoDialog, detail: { caption: 'Hello ?' } })
				console.info(`result1`, result1)
				if (result1.success) {
					const result2 = await dialog.confirmDelete(`100% sure ?`)
					console.info(`result2`, result2)
				}
				console.info('done')
			}}
		>
			Show ???
		</Button>
	</div>
</div>
