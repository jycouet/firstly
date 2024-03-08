import './app.css'

import App from './App.svelte'

const app = new App({
  target: document.getElementById('app'),
  props: {
    // @ts-expect-error
    remultKitData: remultKitData,
  },
})

export default app
