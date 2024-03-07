import type { Plugin } from 'vite'
import { stripper } from 'vite-plugin-stripper'

// import { Log } from '@kitql/helpers'

export function remultKit(options?: { stripper?: { debug?: boolean } }): Plugin[] {
	// const log = new Log('remult-kit')

	return [
		{
			name: 'vite-plugin-remult-kit',
			enforce: 'pre',

			config: async (a, b) => {
				// THE ERROR:
				// RollupError: Unexpected character '�'
				// This code (A) is to fix in `build` mode
				a.build = {
					rollupOptions: {
						external: ['oslo/password', 'osla'],
					},
				}
				// This code (B) is to fix in `dev` mode
				a.optimizeDeps = {
					exclude: ['oslo/password', 'oslo', ...(a.optimizeDeps?.exclude || [])],
				}
			},
		},

		...stripper({
			decorators: ['BackendMethod'],
			debug: options?.stripper?.debug ?? false,
			hard: true,
			packages: ['oslo/password', 'oslo'],
		}),
	]
}
