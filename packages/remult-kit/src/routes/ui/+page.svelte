<script lang="ts">
	import type { KitBaseItem } from '$lib'
	import { Button } from '$lib'
	import { dialog } from '$lib/ui/dialog/dialog'
	import FieldContainer from '$lib/ui/internals/FieldContainer.svelte'
	import Input from '$lib/ui/internals/Input.svelte'
	import MultiSelectMelt from '$lib/ui/internals/select/MultiSelectMelt.svelte'
	import SelectMelt from '$lib/ui/internals/select/SelectMelt.svelte'

	import DemoDialog from './DemoDialog.svelte'

	let bicycles: KitBaseItem[] = [
		{
			id: '1',
			caption: 'Mountain Bike',
			// disabled: false,
		},
		{
			id: '2',
			caption: 'Road Bike',
			// disabled: false,
		},
		{
			id: '3',
			caption: 'Gravel Bike',
			// disabled: false,
		},
		{
			id: '4',
			caption: 'BMX',
			// disabled: false,
		},
		{
			id: '5',
			caption: 'Electric Bike',
			// disabled: false,
		},
		{
			id: '6',
			caption: 'Tandem Bike',
			// disabled: false,
		},
	]
	let selected: string = String(bicycles[2].id)
	let selectedMulti: string[] = [String(bicycles[2].id)]
</script>

<p>
	You should probably never use directly the FieldContainer component, but rather use the Field
	component.
</p>
<div class="grid grid-cols-3 gap-4">
	<FieldContainer forId="123" label="default"></FieldContainer>
	<FieldContainer forId="234" label="label 123">
		<input id="234" class="input input-bordered w-full" />
	</FieldContainer>
	<FieldContainer forId="345" error="This is an error"></FieldContainer>

	<!-- next line -->

	<FieldContainer forId="456" label="default">
		<Input class="input input-bordered"></Input>
	</FieldContainer>
	<FieldContainer forId="567" label="label 123"></FieldContainer>
	<FieldContainer
		forId="678"
		error="This is a long error... very very long, very very long, very very long"
	></FieldContainer>

	<!-- next line -->

	<!-- <FieldContainer label="First select" forId="a">
		<Select id="sd" items={bicycles} bind:value={selected}></Select>
	</FieldContainer> -->

	<FieldContainer label="Melt Select" forId="a">
		<SelectMelt
			id="a"
			items={bicycles}
			bind:value={selected}
			on:selected={(e) => {
				console.info(`e`, e)
			}}
		></SelectMelt>
	</FieldContainer>
	<div>
		Selected:
		<pre>{JSON.stringify(selected, null, 2)}</pre>
		selectedMulti:
		<pre>{JSON.stringify(selectedMulti, null, 2)}</pre>
	</div>
	<div>
		<FieldContainer label="Melt Select" forId="a">
			<MultiSelectMelt
				id="a"
				items={bicycles}
				bind:values={selectedMulti}
				on:selected={(e) => {
					console.info(`e`, e)
				}}
			></MultiSelectMelt>
		</FieldContainer>
	</div>

	<!-- next line -->

	<div>
		<Button
			on:click={async () => {
				const result1 = await dialog.show({ component: DemoDialog, detail: { caption: 'Hello ?' } })
				console.info(`result1`, result1)
				if (result1.success) {
					const result2 = await dialog.confirmDelete(`100% sure ?`)
					console.info(`result2`, result2)
				}
				console.info('done')
			}}
		>
			Show Confirm Delete
		</Button>
	</div>
</div>
