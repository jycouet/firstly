<script lang="ts">
	import { createLocaleSettings, format, formatWithLocale, PeriodType } from '@layerstack/utils'

	import { remult } from 'remult'

	// import { storeList } from '$lib'
	import { AuthController } from '$lib/auth'
	import Button from '$lib/ui/Button.svelte'

	const fr = createLocaleSettings({
		locale: 'fr',

		formats: {
			dates: {
				baseParsing: 'dd/MM/yyyy',
				ordinalSuffixes: {
					one: 'er',
				},
			},

			numbers: {
				defaults: {
					currency: 'EUR',
				},
			},
		},

		dictionary: {
			Ok: 'Valider',
			Cancel: 'Annuler',

			Date: {
				Start: 'Début',
				End: 'Fin',

				Day: 'Jour',
				DayTime: 'Jour & Heure',
				Time: 'Heure',
				Week: 'Semaine',
				Month: 'Mois',
				Quarter: 'Trimestre',
				CalendarYear: 'Année',
				FiscalYearOct: 'Année fiscale (octobre)',
				BiWeek: 'Bi-hebdomadaire',

				PeriodDay: {
					Current: "Aujourd'hui",
					Last: 'Hier',
					LastX: 'Les {0} derniers jours',
				},

				//...
			},
		},
	})
</script>

<div class="flex flex-col gap-4">
	{#if remult.user}
		<div class="flex justify-between">
			<div class="text-2xl">
				Welcome <b>{remult.user?.name}</b>
			</div>
			<div>
				<Button
					class="btn-outline btn-warning"
					onclick={async () => {
						await AuthController.signOut()
						window.location.href = '/'
					}}
				>
					Sign out
				</Button>
			</div>
		</div>
	{:else}
		<div class="text-2xl">
			Welcome <b>👋</b>
		</div>
	{/if}
</div>

{format(7.11, 'currency')}
<br />
{formatWithLocale(fr, 7.11, 'currency')}
{formatWithLocale(fr, new Date('1986-11-07T06:05:04'), PeriodType.Day)}

<!-- <pre>{JSON.stringify($store, null, 2)}</pre> -->
