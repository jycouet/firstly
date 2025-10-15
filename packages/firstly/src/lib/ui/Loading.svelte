<script lang="ts">
	import { tw } from '../utils/tailwind'

	export { extraClass as class }
	let extraClass = ''
</script>

<!-- To fix one capa & cadb are on the same css -->
<div
	class={tw(
		'flex h-4 w-full skeleton items-center justify-center rounded-lg bg-base-content/20',
		extraClass,
	)}
>
	<slot />
</div>
