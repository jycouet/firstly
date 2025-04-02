import { type Handle } from '@sveltejs/kit'

import { remult } from 'remult'

export type RouteGuardConfig = {
	/**
	 * Routes that require authentication (e.g. `{ path: '/app*' }`)
	 */
	guard: { path: string }[]

	/**
	 * Where to redirect when authentication is required but user is not logged in
	 */
	login: string

	/**
	 * We need this import
	 *
	 * `import { redirect } from '@sveltejs/kit'` */
	redirect: (status: number, url: string) => void
}

function pathMatchesPattern(path: string, pattern: string): boolean {
	// Convert the pattern to a regex
	const regexPattern = pattern.replace(/\//g, '\\/').replace(/\*/g, '.*')

	const regex = new RegExp(`^${regexPattern}$`)
	return regex.test(path)
}

function pathMatchesAnyPattern(path: string, patterns: { path: string }[]): boolean {
	return patterns.some((pattern) => pathMatchesPattern(path, pattern.path))
}

/**
 * Creates a handle function with the provided route guard configuration
 */
export function handleGuard(config: RouteGuardConfig): Handle {
	return async ({ event, resolve }) => {
		const pathname = event.url.pathname
		const isAuthenticated = !!remult.user

		const isAuthenticatedRoute = pathMatchesAnyPattern(pathname, config.guard)

		// If user is not authenticated and tries to access an authenticated route
		if (!isAuthenticated && isAuthenticatedRoute) {
			// Redirect to login with the current URL as the redirect target
			// Only redirect if we're not already on the login page
			const isLoginPage = pathname === config.login || pathname === config.login.replace(/\/$/, '')
			if (!isLoginPage) {
				const encodedReturnUrl = encodeURIComponent(pathname + event.url.search)
				const separator = config.login.includes('?') ? '&' : '?'
				const loginUrl = `${config.login}${separator}redirect=${encodedReturnUrl}`

				config.redirect(302, loginUrl)
			}
		}

		return resolve(event)
	}
}
