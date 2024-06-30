// const plugin = require('tailwindcss/plugin')
// const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './src/**/*.{html,svelte,md,ts,js}',
    //'./node_modules/svelte-ux/**/*.{svelte,js}'
  ],

  daisyui: {
    themes: [
      {
        RemultKit: {
          // dracula
          // luxury
          // night
          // business
          // coffee
          // dim
          ...require('daisyui/src/theming/themes')['dim'],
          primary: '#029431',
          secondary: '#42B4E6',
          accent: '#D42A21',
        },
      },
    ],
    logs: false, // Shows info about daisyUI version and used config in the console when building your CSS
  },

  variants: {
    extend: {},
  },

  plugins: [require('daisyui')],
}
