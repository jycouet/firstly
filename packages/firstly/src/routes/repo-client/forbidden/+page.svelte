<script lang="ts">
	import { ApiSecret } from '$modules/demo/ApiItem'
	import { repoClient } from '$lib/svelte'

	let secrets = $derived(await repoClient(ApiSecret).find())
</script>

{#each secrets as secret (secret.id)}
	<p>{secret.title}</p>
{/each}
