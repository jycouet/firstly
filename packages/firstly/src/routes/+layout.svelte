<script lang="ts">
	// import { mdiHome } from '@mdi/js'
	import { remult, repo } from 'remult'

	import { page } from '$app/stores'

	import DialogManagement from '$lib/ui/dialog/DialogManagement.svelte'
	import { route } from '$lib2/ROUTES'

	import '../app.pcss'
	import '../lib/svelte/firstly.css'

	import { createSubscriber } from 'svelte/reactivity'

	import { Remult } from 'remult'
	import { daisyTheme, defaultTheme, emptyTheme, FF_Config } from 'firstly/svelte'
	import type { DynamicCustomField, Theme } from 'firstly/svelte'

	import EditCustom from '$modules/task/ui/EditCustom.svelte'
	import Title from '$modules/task/ui/Title.svelte'
	import { _AppUser } from '$modules/user/AppUser'
	import { AuthController } from '$lib/auth'

	import type { LayoutData } from './$types'

	interface Props {
		data: LayoutData
		children?: import('svelte').Snippet
	}

	let { children, data }: Props = $props()
	remult.user = data.user

	const links = [
		{ path: route('/'), text: 'Home' },
		{ path: route('/auth'), text: 'Manual Auth' },
		{ path: route('/ui/dialog'), text: 'UI / Dialog' },
		{ path: route('/ui/enum'), text: 'UI / Enum' },
		{ path: route('/ui/fieldGroup'), text: 'UI / FieldGroup' },
		{ path: route('/ui/select'), text: 'UI / Select' },
		{ path: route('/carbone'), text: 'Carbone' },
		{ path: route('/demo/FF_Simple'), text: 'Demo Simple' },
		{ path: route('/demo/FF_Form_Grid'), text: 'Demo Form Grid' },
		{ path: route('/demo/FF_Layout'), text: 'Demo Layout' },
		{ path: route('/demo/FF_Layout/grid'), text: 'Demo Layout Grid' },
		{ path: route('/demo/FF_Cell'), text: 'Demo Cell' },

		{ path: route('firstly_sign_in'), text: '🔑 Module Auth', target: '_blank' },
		{ path: route('remult_admin'), text: '🌐 Remult Admin', target: '_blank' },
		{
			path: route('github', { owner: 'remult', repo: 'remult' }),
			text: '⭐️ remult',
			target: '_blank',
		},
		{ path: route('github'), text: '⭐️ firstly', target: '_blank' },
	]

	// To be done once in the application.
	function initRemultSvelteReactivity() {
		// Auth reactivity (remult.user, remult.authenticated(), ...)
		{
			let update = () => {}
			let s = createSubscriber((u) => {
				update = u
			})
			remult.subscribeAuth({
				reportObserved: () => s(),
				reportChanged: () => update(),
			})
		}

		// Entities reactivity
		{
			Remult.entityRefInit = (x) => {
				let update = () => {}
				let s = createSubscriber((u) => {
					update = u
				})
				x.subscribe({
					reportObserved: () => s(),
					reportChanged: () => update(),
				})
			}
		}
	}
	initRemultSvelteReactivity()

	const dynamicCustomField: DynamicCustomField = ({ field, value, error, mode }) => {
		if (field.inputType === 'number' && mode === 'display') {
			return Title
		}
		if (field.inputType === 'number' && mode === 'edit') {
			return EditCustom
		}
		return undefined
	}

	// Set the default theme
	const themes: Record<_AppUser['theme'], Theme> = {
		default: defaultTheme,
		daisy: daisyTheme,
		empty: emptyTheme,
	} as const

	let currentTheme: Theme = $state(themes[remult.user?.theme ?? 'daisy'])
</script>

<svelte:head>
	<title>Firstly</title>
</svelte:head>

<!-- Old stuff -->
<DialogManagement />

<FF_Config theme={currentTheme} {dynamicCustomField}>
	<div class="drawer min-h-screen bg-base-200 lg:drawer-open">
		<input id="my-drawer" type="checkbox" class="drawer-toggle" />
		<!-- content -->
		<main class="drawer-content">
			<div class="grid grid-cols-12 grid-rows-[min-content] gap-y-12 p-4 lg:gap-x-12 lg:p-10">
				<!-- header -->
				<header class="col-span-12 flex items-center gap-2 lg:gap-4">
					<label for="my-drawer" class="btn btn-square btn-ghost drawer-button lg:hidden">
						<svg data-src="https://unpkg.com/heroicons/20/solid/bars-3.svg" class="h-5 w-5"></svg>
					</label>
					<div class="grow">
						<h1 class="lg:text-2xl lg:font-light">
							{links.find((c) => c.path === $page.url.pathname)?.text ??
								$page.url.pathname.replace('/', '')}
						</h1>
					</div>
					<div>
						<input type="text" placeholder="Search" class="input input-sm max-sm:w-24" />
					</div>
					<!-- dropdown -->
					<div class="dropdown dropdown-end z-10">
						<div role="menu" tabindex="0" class="btn btn-circle btn-ghost">
							<div class="indicator">
								<span class="badge indicator-item badge-error badge-xs"></span>
								<svg data-src="https://unpkg.com/heroicons/20/solid/bell.svg" class="h-5 w-5"></svg>
							</div>
						</div>
						<ul class="menu dropdown-content mt-3 w-80 rounded-box bg-base-100 p-2 shadow-2xl">
							<li>
								<a href="/" class="gap-4">
									<div class="avatar">
										<div class="w-8 rounded-full">
											<img src="https://picsum.photos/80/80?1" alt="one" />
										</div>
									</div>
									<span>
										<b>New message</b>
										<br />
										Alice: Hi, did you get my files?
									</span>
								</a>
							</li>
							<li>
								<a href="/" class="gap-4">
									<div class="avatar">
										<div class="w-8 rounded-full">
											<img src="https://picsum.photos/80/80?2" alt="one" />
										</div>
									</div>
									<span>
										<b>Reminder</b>
										<br />
										Your meeting is at 10am
									</span>
								</a>
							</li>
							<li>
								<a href="/" class="gap-4">
									<div class="avatar">
										<div class="w-8 rounded-full">
											<img src="https://picsum.photos/80/80?3" alt="one" />
										</div>
									</div>
									<span>
										<b>New payment</b>
										<br />
										Received $2500 from John Doe
									</span>
								</a>
							</li>
							<li>
								<a href="/" class="gap-4">
									<div class="avatar">
										<div class="w-8 rounded-full">
											<img src="https://picsum.photos/80/80?4" alt="one" />
										</div>
									</div>
									<span>
										<b>New payment</b>
										<br />
										Received $1900 from Alice
									</span>
								</a>
							</li>
						</ul>
					</div>
					<!-- /dropdown -->
					<!-- dropdown -->
					<div class="dropdown dropdown-end z-10">
						<div role="menu" tabindex="0" class="avatar btn btn-circle btn-ghost">
							{#if !remult.authenticated()}
								<div class="w-10 rounded-full bg-red-700"></div>
							{:else if remult.user?.name === 'Ermin'}
								<div class="w-10 rounded-full bg-green-700"></div>
							{:else}
								<div class="w-10 rounded-full">
									<img src="https://avatars.githubusercontent.com/u/5312607?v=4" alt="avatar" />
								</div>
							{/if}
						</div>
						<ul class="menu dropdown-content mt-3 w-52 rounded-box bg-base-100 p-2 shadow-2xl">
							<li>
								<a href={route('/auth')}>Auth</a>
							</li>
							<li></li>
							<li>
								<button
									onclick={async () => {
										const res = await AuthController.signInDemo('JYC')
										remult.user = res.user
									}}
								>
									Sign in JYC
								</button>
							</li>
							<li>
								<button
									onclick={async () => {
										const res = await AuthController.signInDemo('Ermin')
										remult.user = res.user
									}}
								>
									Sign in Ermeen
								</button>
							</li>
							<li>
								<button
									onclick={async () => {
										const res = await AuthController.signOut()
										remult.user = res.user
									}}
								>
									Sign out
								</button>
							</li>
							<!-- <li>
								<a href="/">
									Inbox
									<span class="badge badge-success">12</span>
								</a>
							</li> -->
							<li></li>
							<li>
								<button
									onclick={async () => {
										currentTheme = defaultTheme
										if (remult.user?.id) {
											await repo(_AppUser).update(remult.user?.id, { theme: 'default' })
										}
									}}
								>
									Theme: Default
								</button>
							</li>
							<li>
								<button
									onclick={async () => {
										currentTheme = daisyTheme
										if (remult.user?.id) {
											await repo(_AppUser).update(remult.user?.id, { theme: 'daisy' })
										}
									}}
								>
									Theme: Daisy
								</button>
							</li>
							<li>
								<button
									onclick={async () => {
										currentTheme = emptyTheme
										if (remult.user?.id) {
											await repo(_AppUser).update(remult.user?.id, { theme: 'empty' })
										}
									}}
								>
									Theme: Empty
								</button>
							</li>
						</ul>
					</div>
					<!-- /dropdown -->
				</header>
				<!-- /header -->

				<div class="col-span-12">
					{@render children?.()}
				</div>
			</div>
		</main>
		<!-- /content -->
		<aside class="drawer-side z-10">
			<label for="my-drawer" class="drawer-overlay"></label>
			<!-- sidebar menu -->
			<nav class="flex min-h-screen w-72 flex-col gap-2 overflow-y-auto bg-base-100 px-6 py-10">
				<div class="mx-4 flex items-center gap-2 font-black">
					<svg
						width="32"
						height="32"
						viewBox="0 0 1024 1024"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect x="256" y="670.72" width="512" height="256" rx="128" class="fill-base-content" />
						<circle cx="512" cy="353.28" r="256" class="fill-base-content" />
						<circle cx="512" cy="353.28" r="261" stroke="black" stroke-opacity="0.2" stroke-width="10" />
						<circle cx="512" cy="353.28" r="114.688" class="fill-base-100" />
					</svg>
					Firstly
				</div>
				<ul class="menu">
					{#each links as link}
						<li>
							<a
								href={link.path}
								class={link.path === $page.url.pathname ? 'active' : ''}
								target={link?.target}
							>
								<svg data-src="https://unpkg.com/heroicons/20/solid/home.svg" class="h-5 w-5"></svg>
								{link.text}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
			<!-- /sidebar menu -->
		</aside>
	</div>
</FF_Config>
