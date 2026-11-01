import adapter from '@sveltejs/adapter-node'

// svelte-package resolves aliases in comments too: JSDoc samples must keep `firstly/...`
const packaging = process.argv[1]?.includes('svelte-package')

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [{ prebundleSvelteLibraries: true }],
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		alias: {
			$modules: './src/modules',
			$server: './src/server',

			...(packaging ? {} : { firstly: './src/lib' }),
			$lib2: './src/lib2',
		},
	},
	compilerOptions: {},
	onwarn(warning, defaultHandler) {
		// Do not show 3rd party warnings
		if (warning.filename.includes('node_modules')) return

		defaultHandler(warning)
	},
}

export default config
