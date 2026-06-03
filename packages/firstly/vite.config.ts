import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { svelteTesting } from '@testing-library/svelte/vite'
import { defineConfig, loadEnv } from 'vite'

import type { KIT_ROUTES } from '$modules/ROUTES'

import { firstly } from './src/lib/vite'

// @ts-ignore
const config = defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	return {
		server: {
			fs: {
				// FIXME: Allow serving files from one level up to the project root (I don't know why this is necessary... I probably did something wrong in the monorepo...)
				// allow: ['../../../..'],
			},
			host: env.HOST ?? '127.0.0.1',
			port: parseInt(env.PORT ?? '3132'),
		},
		build: {
			rollupOptions: {
				output: {
					manualChunks: (id) => {
						if (id.includes('src/lib')) return 'firstly'
					},
				},
			},
		},
		plugins: [
			firstly<KIT_ROUTES>({
				kitRoutes: {
					// It's not something that we want to expose in the lib
					generated_file_path: 'src/modules/ROUTES.ts',
					LINKS: {
						remult_admin: '/api/admin',
						github: {
							href: 'https://github.com/[owner]/[repo]',
							params: {
								owner: { default: 'jycouet' },
								repo: { default: 'firstly' },
							},
						},
					},
				},
			}),
			sveltekit(),
			tailwindcss(),
		],
		test: {
			projects: [
				{
					// Pure-TS tests run in node.
					extends: true,
					test: {
						name: 'node',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}'],
						exclude: [
							'src/**/*.svelte.{test,spec}.{js,ts}',
							'src/lib/evlog/stats/**/*.spec.ts',
							'src/lib/evlog/EvlogStats.spec.ts',
						],
						setupFiles: ['./src/test-setup.ts'],
					},
				},
				{
					// Svelte rune tests ($state/$effect) need a real browser - in node/SSR
					// mode `$effect` compiles to a no-op and never runs. Uses the same
					// playwright/chromium that CI already installs for e2e.
					extends: true,
					test: {
						name: 'svelte',
						include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
						browser: {
							enabled: true,
							provider: 'playwright',
							headless: true,
							instances: [{ browser: 'chromium' }],
						},
					},
				},
				{
					// evlog dashboard panels: presentational, asserted via @testing-library/svelte in jsdom.
					extends: true,
					plugins: [svelteTesting()],
					test: {
						name: 'svelte-jsdom',
						include: ['src/lib/evlog/stats/**/*.spec.ts', 'src/lib/evlog/EvlogStats.spec.ts'],
						environment: 'jsdom',
						setupFiles: ['./src/test-setup.ts'],
					},
				},
			],
		},
	}
})

export default config
