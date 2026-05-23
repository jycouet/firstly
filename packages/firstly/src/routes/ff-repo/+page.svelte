<script lang="ts">
	import { DemoGrid } from 'firstly/svelte'

	import { Task } from '$modules/demo/Task'
</script>

<h1>DemoGrid</h1>

<DemoGrid entity={Task} fields={['title']} />
