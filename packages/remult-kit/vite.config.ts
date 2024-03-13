import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

import type { KIT_ROUTES } from '$lib/ROUTES'

import { remultKit } from './src/lib/vite'

const config = defineConfig({
  plugins: [remultKit<KIT_ROUTES>({}), sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
})

export default config
