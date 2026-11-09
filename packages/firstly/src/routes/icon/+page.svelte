<script lang="ts">
	import { mdiPencil } from '@mdi/js'
	import { Skull } from 'lucide'

	import {
		Icon,
		LibIcon_Delete,
		LibIcon_Edit,
		LibIcon_Man,
		FF_Config,
		type IconSsr,
	} from 'firstly/svelte'

	import { page } from '$app/state'

	// no param: no icon config, the defaults
	const param = page.url.searchParams.get('ssr')
	const ssr: IconSsr = param === 'false' ? false : param === 'true' || 'sprite'

	const svg = `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg>`
</script>

<FF_Config icon={param ? { ssr } : undefined}>
	<div class="flex flex-col gap-4 p-8">
		<p>
			ssr: <code data-ssr>{ssr}</code> (<a href="?">default</a>, <a href="?ssr=false">false</a>,
			<a href="?ssr=sprite">sprite</a>, <a href="?ssr=true">true</a>)
		</p>

		<div class="flex items-center gap-2" data-misc>
			<Icon data={Skull} caption="Skull" />
			<Icon data={Skull} strokeWidth={1} />
			<Icon data={mdiPencil} class="text-red-500" />
			<Icon data={LibIcon_Man} />
			<Icon data={svg} />
			<Icon><b>!</b></Icon>
		</div>

		<table>
			<tbody>
				{#each { length: 20 }, r (r)}
					<tr data-row>
						<td>Row {r}</td>
						<td><Icon data={LibIcon_Edit} size="1rem" /></td>
						<td><Icon data={LibIcon_Delete} size="1rem" /></td>
						<td><Icon data={mdiPencil} size="1rem" /></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</FF_Config>
