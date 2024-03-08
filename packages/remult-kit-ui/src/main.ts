import './app.css'

import App from './App.svelte'

// const remultKitData = {
//   component: 'One',
//   button: {
//     label: 'Yop',
//   },
// }

const app = new App({
  target: document.getElementById('app'),
  props: {
    // @ts-ignore
    remultKitData: remultKitData,
  },
})

export default app
