import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { watchAndRun } from 'vite-plugin-watch-and-run'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte({})],
  build: { outDir: '../remult-kit/static/ui', assetsDir: './assets' },
})
