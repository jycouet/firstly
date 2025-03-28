// See https://kit.svelte.dev/docs/types#app

import type { _AppUser } from '$modules/user/AppUser'

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: UserInfo
		}
		// interface PageData {}
		// interface Platform {}
	}
}

declare module 'remult' {
	interface UserInfo {
		theme: _AppUser['theme']
	}
}

export {}
