<script lang="ts">
	import { page } from '$app/stores'
</script>

<div class="flex h-screen items-center justify-center">
	<div class="flex flex-col items-center gap-4">
		<h1 class="text-2xl">{$page.status}</h1>
		<h2>{$page.error?.message}</h2>
		<div>---</div>
		<span>
			👉 <a href="/" target="_self">Retour à l'accueil</a>
		</span>
	</div>
</div>
