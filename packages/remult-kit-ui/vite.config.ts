import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte({})],
  build: {
    outDir: '../remult-kit/src/lib/auth/ui',
    assetsDir: './assets',
  },
  server: {
    port: 4242,
  },
})
