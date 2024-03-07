<script lang="ts">
	// import { mdiHome } from '@mdi/js'
	import { page } from '$app/stores'

	import { route } from '$lib/ROUTES'
	import DialogManagement from '$lib/ui/dialog/DialogManagement.svelte'

	import '../app.pcss'

	const links = [
		{ path: route('/'), text: 'Home' },
		{ path: route('/ui'), text: 'UI' },
		{ path: route('/remult'), text: 'Remult' },
		{ path: route('/remult/select'), text: 'Remult Select' },
		{ path: route('/remult/enum'), text: 'Remult Enum' },
		{ path: route('/remult/auth'), text: 'Remult Auth' },
		{ path: route('remult_admin'), text: 'Remult Admin' },
	]
</script>

<svelte:head>
	<title>Remult Kit</title>
</svelte:head>

<DialogManagement />

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
						<div class="w-10 rounded-full">
							<img src="https://avatars.githubusercontent.com/u/5312607?v=4" alt="avatar" />
						</div>
					</div>
					<ul class="menu dropdown-content mt-3 w-52 rounded-box bg-base-100 p-2 shadow-2xl">
						<li>
							<a href="/">Profile</a>
						</li>
						<li>
							<a href="/">
								Inbox
								<span class="badge badge-success">12</span>
							</a>
						</li>
						<li><a href="/">Settings</a></li>
						<li><a href="/">Logout</a></li>
					</ul>
				</div>
				<!-- /dropdown -->
			</header>
			<!-- /header -->

			<div class="col-span-12">
				<slot />
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
				Remult Kit
			</div>
			<ul class="menu">
				{#each links as link}
					<li>
						<a href={link.path} class={link.path === $page.url.pathname ? 'active' : ''}>
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
