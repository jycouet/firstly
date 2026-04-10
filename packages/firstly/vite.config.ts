import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

import type { KIT_ROUTES } from '$lib2/ROUTES'

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
			include: ['src/**/*.{test,spec}.{js,ts}'],
		},
	}
})

export default config
