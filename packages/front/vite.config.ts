import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { kitRoutes } from 'vite-plugin-kit-routes'

import type { KIT_ROUTES } from '$lib/ROUTES'

export default defineConfig({
  plugins: [
    sveltekit(),
    tailwindcss(),
    kitRoutes<KIT_ROUTES>({
      path_base: true,
      PAGES: {
        '/auth': {
          explicit_search_params: {
            email: {},
          },
        },
        '/auth/sign-up': {
          explicit_search_params: {
            email: {},
          },
        },
        '/auth/forgot-password': {
          explicit_search_params: {
            email: {},
          },
        },
      },
    }),
  ],
})
