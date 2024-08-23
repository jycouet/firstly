import path from 'path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { watchAndRun } from 'vite-plugin-watch-and-run'

export default defineConfig({
  server: {
    port: 4242,
  },
  plugins: [
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
})
