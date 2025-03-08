<script lang="ts">
	import { getEnum, getEnums, Icon } from '$lib'
	import FieldContainer from '$lib/ui/internals/FieldContainer.svelte'
	import Input from '$lib/ui/internals/Input.svelte'
	import { StateDemoEnum } from '$lib/virtual/StateDemoEnum'

	const list = getEnums(StateDemoEnum)
	console.info(`l`, list)

	const selCheck2 = getEnum(StateDemoEnum, 'CHECK2')
	console.info(`selCheck2`, selCheck2)

	const selCheck = getEnum(StateDemoEnum, 'CHECK')
	console.info(`selCheck`, selCheck)

	let selected: string | undefined = undefined
</script>

<div class="grid grid-cols-4 gap-4">
	<FieldContainer label="Civilité" forId="sd" classes={{}}>
		<div class="input input-bordered flex w-fit min-w-0 items-center">
			<div class="-mx-2 flex gap-2">
				{#each list as { id, caption, icon }}
					<button
						on:click={() => {
							selected = id
						}}
						type="button"
						class="min-w-0 cursor-pointer rounded-md px-1.5 py-1 {selected === id
							? 'bg-primary text-primary-content'
							: ''}"
					>
						<div class="flex gap-2">
							<Icon {...icon} />
							{caption}
						</div>
					</button>
				{/each}
			</div>
		</div>
	</FieldContainer>

	<FieldContainer forId="456" label="default">
		<Input class="input input-bordered"></Input>
	</FieldContainer>
</div>
