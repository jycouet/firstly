import adapter from '@sveltejs/adapter-node'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, loadEnv } from 'vite'

import type { KIT_ROUTES } from '$modules/ROUTES'

import { firstly } from './src/lib/vite/index.js'

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
			sveltekit({
				adapter: adapter(),
				alias: {
					$modules: './src/modules',
					firstly: './src/lib',
				},
				onwarn(warning, defaultHandler) {
					// Do not show 3rd party warnings
					if (warning.filename?.includes('node_modules')) return
					defaultHandler(warning)
				},
			}),
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
						exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
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
							provider: playwright(),
							headless: true,
							instances: [{ browser: 'chromium' }],
						},
					},
				},
			],
		},
	}
})

export default config
