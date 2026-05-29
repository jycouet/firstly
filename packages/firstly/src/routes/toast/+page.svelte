<script lang="ts">
	import { FF_ToastManager, toast } from 'firstly/svelte'
</script>

<FF_ToastManager />

<div class="mx-auto flex max-w-md flex-col gap-3 p-8">
	<h1 class="text-xl font-semibold">Toast demo</h1>
	<div class="flex flex-wrap gap-2">
		<button class="border-border rounded-md border px-3 py-1.5 text-sm" onclick={() => toast.success('Saved')}>
			success
		</button>
		<button class="border-border rounded-md border px-3 py-1.5 text-sm" onclick={() => toast.error('Nope')}>
			error
		</button>
		<button class="border-border rounded-md border px-3 py-1.5 text-sm" onclick={() => toast.info('FYI')}>
			info
		</button>
		<button class="border-border rounded-md border px-3 py-1.5 text-sm" onclick={() => toast.warning('Careful')}>
			warning
		</button>
		<button
			class="border-border rounded-md border px-3 py-1.5 text-sm"
			onclick={() =>
				toast.info('With action', {
					description: 'Click undo',
					action: { label: 'Undo', onClick: () => toast.success('Undone') },
				})}
		>
			action
		</button>
		<button
			class="border-border rounded-md border px-3 py-1.5 text-sm"
			onclick={() => toast.fromError(new Error('boom from Error'))}
		>
			fromError
		</button>
	</div>
</div>
