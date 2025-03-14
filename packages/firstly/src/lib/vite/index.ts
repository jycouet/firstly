import {
	//mergeConfig
	type PluginOption,
} from 'vite'
import { kitRoutes, type Options, type RouteMappings } from 'vite-plugin-kit-routes'
import { stripper } from 'vite-plugin-stripper'

// import { Log } from '@kitql/helpers'

// const toRemove = ['@node-rs/argon2', '@node-rs/bcrypt']
// oslo needs to be in the dependencies (not devDependencies) !!
// const toRemove = ['oslo/password', 'oslo']

export function firstly<KIT_ROUTES extends RouteMappings>(options?: {
	stripper?: { debug?: boolean }
	kitRoutes?: Options<KIT_ROUTES>
}): PluginOption {
	// @ts-ignore
	return [
		// {
		//   name: 'vite-plugin-firstly',
		//   enforce: 'pre',

		//   config: async (a) => {
		//     return mergeConfig(a, {
		//       build: {
		//         // THE ERROR:
		//         // RollupError: Unexpected character '�' or Unexpected character '\u{7f}'
		//         // This code (A) is to fix in `build` mode
		//         rollupOptions: {
		//           external: toRemove,
		//         },
		//       },
		//       // This code (B) is to fix in `dev` mode
		//       optimizeDeps: {
		//         exclude: toRemove,
		//       },
		//     })
		//   },
		// },

		// @ts-ignore
		...kitRoutes<KIT_ROUTES>({
			...(options?.kitRoutes ?? {}),
			...{
				format_page_route_id: true,
				logs: {
					...options?.kitRoutes?.logs,
					post_update_run: false,
					update: false,
				},
			},
		}),

		// @ts-ignore
		...stripper({
			decorators: ['BackendMethod'],
			hard: true,
			debug: options?.stripper?.debug ?? false,
			nullify: ['$env/static/private', '$env/dynamic/private'],
		}),
	]
}
