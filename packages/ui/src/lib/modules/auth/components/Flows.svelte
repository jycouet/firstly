<script lang="ts">
	import mermaid from 'mermaid'

	import type { FirstlyDataAuth } from '../../../../../../firstly/src/lib/auth/types'

	export let firstlyDataAuth: FirstlyDataAuth

	// The default diagram
	let diagram = `\
sequenceDiagram
actor User
participant Frontend
participant Backend
participant Mail
rect rgb(191, 223, 255)
note right of User: Sign Up flow
User ->> Frontend: SignUp
Frontend-->Frontend: Login
Frontend-->Frontend: Password
Frontend ->> Backend: Create Account
Backend ->> Mail: Send Mail to confirm
Backend ->> Frontend: Logged In
Frontend->> User: Logged In
Mail -->> User: Send Mail to User
User ->> Backend: User Validated
end
`

	let container: any

	async function renderDiagram() {
		const { svg } = await mermaid.render('mermaid', diagram)
		// eslint-disable-next-line
		container.innerHTML = svg
	}

	$: diagram && renderDiagram()
</script>

<textarea bind:value={diagram}></textarea>
<span bind:this={container}></span>
