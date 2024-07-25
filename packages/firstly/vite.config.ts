import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

import type { KIT_ROUTES } from '$lib/ROUTES'

// import { authRoutes } from './src/lib/auth/index'
import { firstly } from './src/lib/vite'

const config = defineConfig({
  plugins: [
    firstly<KIT_ROUTES>({
      kitRoutes: {
        LINKS: {
          // ...authRoutes()?.routes,
          firstly_sign_in: '/fly/auth/sign-in',
          //
          remult_admin: '/api/admin',
          github: {
            href: 'https://github.com/[owner]/[repo]',
            params: {
              owner: { default: '"jycouet"' },
              repo: { default: '"firstly"' },
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
