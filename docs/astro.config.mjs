// @ts-check
import starlight from '@astrojs/starlight'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'

// import dotenv from 'dotenv'

// import vue from '@astrojs/vue'

// dotenv.config()

// https://astro.build/config
export default defineConfig({
  vite: {},
  site: 'https://firstly.fun',
  integrations: [
    starlight({
      title: 'Firstly',
      logo: {
        light: './src/assets/logo.svg',
        dark: './src/assets/logo.svg',
        // replacesTitle: true,
      },
      social: {
        blueSky: 'https://bsky.app/profile/jyc.dev',
        github: 'https://github.com/jycouet/firstly',
      },
      editLink: {
        baseUrl: 'https://github.com/jycouet/firstly/edit/main/',
      },
      components: {
        Head: './src/components/Head.astro',
      },
      sidebar: [
        {
          label: 'Introduction',
          items: [
            {
              label: 'Why ?',
              link: '/docs/why',
            },
            {
              label: 'Getting Started',
              link: '/docs',
            },
          ],
        },
        {
          label: 'Modules',
          items: [
            {
              label: 'Auth',
              link: '/docs/modules/auth',
            },
            {
              label: 'Mail',
              link: '/docs/modules/mail',
            },
            {
              label: 'Cron',
              link: '/docs/modules/cron',
            },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
    icon(),
    // sentry({
    //   dsn: process.env.SENTRY_DSN,
    //   environment: process.env.SENTRY_ENVIRONMENT,
    //   sourceMapsUploadOptions: {
    //     project: process.env.SENTRY_PROJECT,
    //     authToken: process.env.SENTRY_AUTH_TOKEN,
    //   },
    // }),
    // vue(),
  ],
})
