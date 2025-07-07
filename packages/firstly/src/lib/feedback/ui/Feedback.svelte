<script lang="ts">
	import { dialog } from '../../internals'
	import DialogMilestones from './DialogMilestones.svelte'

	const list = async () => {
		await dialog.show({
			component: DialogMilestones,
			classes: { root: 'overflow-auto w-[90vh] h-[90vh]' },
			detail: { caption: 'Feedback' },
		})
	}
</script>

<button class="text-secondary" on:click={list}>Feedback</button>

<!-- <span class="h-9/12 hidden w-9/12"></span> -->
