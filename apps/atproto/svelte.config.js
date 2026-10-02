import adapter from '@sveltejs/adapter-node'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [{ prebundleSvelteLibraries: true }],
	kit: {
		adapter: adapter(),
		alias: {
			// The lib from source: no build step between the two packages.
			firstly: '../../packages/firstly/src/lib',
		},
	},
	onwarn(warning, defaultHandler) {
		if (warning.filename.includes('node_modules')) return
		defaultHandler(warning)
	},
}

export default config
