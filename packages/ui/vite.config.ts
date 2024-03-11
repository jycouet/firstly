import path from 'path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { watchAndRun } from 'vite-plugin-watch-and-run'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    // @ts-ignore
    watchAndRun([
      {
        name: 'update',
        watch: path.resolve('src/**/*'),
        run: 'npm run build',
        delay: 300,
      },
    ]),
  ],
  build: {
    outDir: '../remult-kit/src/lib/auth/static',
    emptyOutDir: true,
    assetsDir: './assets',
  },
  server: {
    port: 4242,
  },
})
