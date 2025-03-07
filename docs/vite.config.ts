import { defaultTheme } from '@sveltepress/theme-default'
import { sveltepress } from '@sveltepress/vite'
import { defineConfig } from 'vite'

import { sidebar } from './config/sidebar'

const config = defineConfig({
	server: {
		fs: {
			allow: ['../../..'],
		},
	},
	plugins: [
		sveltepress({
			theme: defaultTheme({
				navbar: [
					{
						title: 'Guide',
						to: '/guide',
					},
				],
				sidebar,
				github: 'https://github.com/jycouet/firstly',
				discord: 'https://discord.gg/GXHk7ZfuG5',
				logo: '/firstly.svg',
				themeColor: {
					dark: '#ff3e00',
					light: '#ff3e00',
					primary: '#5B68DF',
					gradient: {
						start: '#5B68DF',
						end: '#FCB335',
					},
					hover: '#ff3e00',
				},
				// highlighter: {
				//   themeDark: 'catppuccin-macchiato',
				// },
				preBuildIconifyIcons: {
					fxemoji: ['constructionsign'],
					heroicons: ['square-3-stack-3d-solid'],
					'vscode-icons': ['file-type-svelte', 'file-type-markdown', 'file-type-vite'],
				},
			}),

			siteConfig: {
				title: 'Firstly',
				description: 'Bee-lieve in better code !',
			},
		}),
	],
})

export default config
