import { defaultTheme } from '@sveltepress/theme-default'
import { sveltepress } from '@sveltepress/vite'
import { defineConfig } from 'vite'

import { sidebar } from './config/sidebar'

const config = defineConfig({
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
        github: 'https://github.com/jycouet/remult-kit',
        discord: 'https://discord.gg/GXHk7ZfuG5',
        logo: '/remult-kit.svg',
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
        title: 'remult-kit',
        description: 'An opinionated Remult setup for SvelteKit',
      },
    }),
  ],
})

export default config
