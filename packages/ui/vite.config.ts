import path from 'path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { watchAndRun } from 'vite-plugin-watch-and-run'

import { firstly } from '../firstly/src/lib/vite'

export default defineConfig({
  plugins: [
    firstly(),
    svelte(),
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
    outDir: '../firstly/src/lib/auth/static',
    emptyOutDir: true,
    assetsDir: './assets',
    rollupOptions: {
      external: ['$env/dynamic/private', '@kitql/internals'],
    },
  },
  server: {
    port: 4242,
  },
})
