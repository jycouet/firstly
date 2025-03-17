import './pico.css'
import './variables.css'

import { mount } from 'svelte';
import App from './App.svelte'

const app = mount(App, {
	// @ts-expect-error
	target: document.getElementById('app'),
	props: {
		// @ts-expect-error
		firstlyData: firstlyData,
	},
})

export default app
