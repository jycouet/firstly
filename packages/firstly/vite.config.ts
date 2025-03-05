import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, loadEnv } from 'vite'

import type { KIT_ROUTES } from '$lib/ROUTES'

// import { authRoutes } from './src/lib/auth/index'
import { firstly } from './src/lib/vite'

// @ts-ignore
const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    server: {
      fs: {
        // FIXME: Allow serving files from one level up to the project root (I don't know why this is necessary... I probably did something wrong in the monorepo...)
        allow: ['../../../..'],
      },
      host: env.HOST ?? '127.0.0.1',
      port: parseInt(env.PORT ?? '3132'),
    },
    plugins: [
      firstly<KIT_ROUTES>({
        kitRoutes: {
          LINKS: {
            // ...authRoutes()?.routes,
            firstly_sign_in: '/ff/auth/sign-in',
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
  }
})

export default config
