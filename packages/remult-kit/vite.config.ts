import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { kitRoutes } from 'vite-plugin-kit-routes'

import type { KIT_ROUTES } from '$lib/ROUTES'

import { remultKit } from './src/lib/vite'

const config = defineConfig({
  plugins: [
    remultKit(),
    // @ts-ignore
    sveltekit(),
    // @ts-ignore
    kitRoutes<KIT_ROUTES>({
      logs: {
        post_update_run: false,
        update: false,
      },
      LINKS: {
        remult_admin: '/api/admin',
      },
    }),
  ],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
})

export default config
