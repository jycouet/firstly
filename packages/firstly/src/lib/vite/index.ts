import {
	//mergeConfig
	type PluginOption,
} from 'vite'
import { kitRoutes, type Options, type RouteMappings } from 'vite-plugin-kit-routes'
import { stripper } from 'vite-plugin-stripper'

// const toRemove = ['async_hooks', 'join', 'fs', 'path']

export function firstly<KIT_ROUTES extends RouteMappings>(options?: {
	stripper?: Parameters<typeof stripper>[0]
	kitRoutes?: Options<KIT_ROUTES>
}): PluginOption {
	// @ts-ignore
	return [
		// {
		// 	name: 'vite-plugin-firstly',
		// 	enforce: 'pre',

		// 	config: async (a) => {
		// 		return mergeConfig(a, {
		// 			build: {
		// 				// THE ERROR:
		// 				// RollupError: Unexpected character '�' or Unexpected character '\u{7f}'
		// 				// This code (A) is to fix in `build` mode
		// 				rollupOptions: {
		// 					external: toRemove,
		// 				},
		// 			},
		// 			// This code (B) is to fix in `dev` mode
		// 			optimizeDeps: {
		// 				exclude: toRemove,
		// 			},
		// 		})
		// 	},
		// },

		// @ts-ignore
		...kitRoutes<KIT_ROUTES>({
			...(options?.kitRoutes ?? {}),
			...{
				format_page_route_id: true,
				logs: {
					post_update_run: false,
					update: false,
					...options?.kitRoutes?.logs,
				},
			},
		}),

		// @ts-ignore
		...stripper({
			strip: options?.stripper?.strip ?? [
				{ decorator: 'BackendMethod' },
				{
					decorator: 'Entity',
					args_1: [
						{ fn: 'backendPrefilter' },
						{ fn: 'backendPreprocessFilter' },
						{ fn: 'sqlExpression' },
						{ fn: 'saved', excludeEntityKeys: ['users'] },
					],
				},
			],
			debug: options?.stripper?.debug ?? false,
			nullify: options?.stripper?.nullify ?? ['$env/static/private', '$env/dynamic/private'],
		}),
	]
}
