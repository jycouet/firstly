import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	return {
		server: {
			host: env.HOST ?? '127.0.0.1',
			port: parseInt(env.PORT ?? '3133'),
		},
		plugins: [sveltekit(), tailwindcss()],
	}
})
