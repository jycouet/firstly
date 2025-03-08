<script lang="ts">
	import { tw } from '../utils/tailwind'

	export { extraClass as class }
	let extraClass = ''
</script>

<!-- To fix one capa & cadb are on the same css -->
<div
	class={tw(
		'skeleton bg-base-content/20 flex h-4 w-full items-center justify-center rounded-lg',
		extraClass,
	)}
>
	<slot />
</div>
