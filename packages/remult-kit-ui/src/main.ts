import './app.css'
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app'),
  paths: {
    base: '/ui',
    assets: '/ui/assets'
  },
  props: {
    remutKitData: remultKitData
  }
})

export default app
