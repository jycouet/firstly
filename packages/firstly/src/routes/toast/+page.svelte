<script lang="ts">
	import { FF_Config, FF_ToastManager, toast } from 'firstly/svelte'

	const btn = 'border-border rounded-md border px-3 py-1.5 text-sm hover:bg-muted'

	// Per-kind default titles, localized via <FF_Config>. Message *functions* re-resolve at
	// toast time, so swapping locale (paraglide/i18next) updates titles for free. Here: French.
	const frTitles = {
		success: () => 'Réussi',
		error: () => 'Erreur',
		info: () => 'Info',
		warning: () => 'Attention',
	}
</script>

<FF_Config messages={{ toast: frTitles }}>
	<FF_ToastManager />

	<div class="mx-auto flex max-w-xl flex-col gap-6 p-8">
		<div>
			<h1 class="text-xl font-semibold">Toast demo</h1>
			<p class="text-muted-foreground text-sm">
				First arg is the <b>description</b> (HTML allowed). The bold <b>title</b> defaults per kind
				and is overridable via <code>opts.title</code>. Default titles here are localized to
				<b>French</b> through <code>&lt;FF_Config messages.toast&gt;</code>.
			</p>
		</div>

		<div class="flex flex-col gap-2">
			<h2 class="text-sm font-medium opacity-70">Kinds (localized default titles)</h2>
			<div class="flex flex-wrap gap-2">
				<button class={btn} onclick={() => toast.success('Vos modifications ont été enregistrées.')}>
					success
				</button>
				<button class={btn} onclick={() => toast.error("Impossible d'enregistrer le devis.")}>
					error
				</button>
				<button class={btn} onclick={() => toast.info('Une nouvelle version est disponible.')}>
					info
				</button>
				<button class={btn} onclick={() => toast.warning('Ce contrat expire bientôt.')}>
					warning
				</button>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<h2 class="text-sm font-medium opacity-70">Custom title (overrides the default)</h2>
			<div class="flex flex-wrap gap-2">
				<button class={btn} onclick={() => toast.success('Ton favori est à jour.', { title: '🎉 Bravo' })}>
					custom title
				</button>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<h2 class="text-sm font-medium opacity-70">HTML description</h2>
			<div class="flex flex-wrap gap-2">
				<button class={btn} onclick={() => toast.success('Enregistré <b>3</b> lignes.<br>Rien d’autre à faire ✅')}>
					html
				</button>
				<button
					class={btn}
					onclick={() =>
						toast.warning('Compte <b>manquant</b> &mdash; voir <a class="underline" href="/toast">la doc</a>.')}
				>
					html + link
				</button>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<h2 class="text-sm font-medium opacity-70">Action / fromError</h2>
			<div class="flex flex-wrap gap-2">
				<button
					class={btn}
					onclick={() =>
						toast.info('Élément déplacé vers la corbeille.', {
							action: { label: 'Annuler', onClick: () => toast.success('Restauré.') },
						})}
				>
					action
				</button>
				<button class={btn} onclick={() => toast.fromError(new Error('boom from Error'))}>
					fromError
				</button>
			</div>
		</div>
	</div>
</FF_Config>
