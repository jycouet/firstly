import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

import type { KIT_ROUTES } from '$lib/ROUTES'

import { remultKit } from './src/lib/vite'

const config = defineConfig({
  // optimizeDeps: {
  //   exclude: ['@node-rs/argon2-darwin-arm64', '@node-rs/bcrypt-darwin-arm64'],
  // },
  plugins: [
    remultKit<KIT_ROUTES>({
      kitRoutes: {
        LINKS: {
          remult_admin: '/api/admin',
          github: {
            href: 'https://github.com/[owner]/[repo]',
            params: {
              owner: { default: '"jycouet"' },
              repo: { default: '"remult-kit"' },
            },
          },
        },
      },
    }),
    sveltekit(),
  ],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
})

export default config
