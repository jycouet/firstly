import './pico.css'
import './variables.css'
import App from './App.svelte'


const app = new App({
  // @ts-expect-error
  target: document.getElementById('app'),
  props: {
    // @ts-expect-error
    remultKitData: remultKitData,
  },
})

export default app
