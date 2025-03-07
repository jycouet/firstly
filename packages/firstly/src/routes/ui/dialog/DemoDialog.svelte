<script lang="ts">
	import { onMount } from 'svelte'

	import Button from '$lib/ui/Button.svelte'
	import { dialog } from '$lib/ui/dialog/dialog'

	export let dialogId: number

	onMount(() => {
		console.info('dialogId', dialogId)
	})
</script>

coucou {dialogId}

<br /><br /><br />

<Button
	on:click={async () => {
		await dialog.confirmDelete('yes?')
	}}
>
	Are you sure ?
</Button>

coucou {dialogId}

<br /><br /><br />
coucou {dialogId}

<br /><br /><br />
coucou {dialogId}

<br /><br /><br />
