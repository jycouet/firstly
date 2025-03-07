import { type Handle } from '@sveltejs/kit'

import { remult } from 'remult'

export type RouteGuardConfig = {
	// Routes that don't require authentication (optional)
	anonymous?: string[]
	// Routes that require authentication
	authenticated: string[]
	// Where to redirect when authentication is required but user is not logged in
	redirectToLogin: string
	// Where to redirect when user is logged in but accessing a public-only route
	redirectAuthenticated: string

	/**
	 * We need this import
	 *
	 * `import { redirect } from '@sveltejs/kit'` */
	redirect: (status: number, url: string) => void
}

/**
 * Checks if a path matches a pattern that may include wildcards
 * @param path The actual path to check
 * @param pattern The pattern that may include wildcards (*)
 */
function pathMatchesPattern(path: string, pattern: string): boolean {
	// Convert the pattern to a regex
	const regexPattern = pattern.replace(/\//g, '\\/').replace(/\*/g, '.*')

	const regex = new RegExp(`^${regexPattern}$`)
	return regex.test(path)
}

/**
 * Checks if a path matches any of the patterns in the array
 */
function pathMatchesAnyPattern(path: string, patterns: string[]): boolean {
	return patterns.some((pattern) => pathMatchesPattern(path, pattern))
}

/**
 * Creates a handle function with the provided route guard configuration
 */
export function handleGuard(config: RouteGuardConfig): Handle {
	return async ({ event, resolve }) => {
		const path = event.url.pathname
		const fullUrl = event.url.pathname + event.url.search
		const isAuthenticated = !!remult.user

		// Check if the path is in the anonymous routes
		const isAnonymousRoute = config.anonymous ? pathMatchesAnyPattern(path, config.anonymous) : false

		// Check if the path is in the authenticated routes
		const isAuthenticatedRoute = pathMatchesAnyPattern(path, config.authenticated)

		// Create login URL with redirect parameter
		const createLoginUrl = (returnUrl: string) => {
			const encodedReturnUrl = encodeURIComponent(returnUrl)
			const separator = config.redirectToLogin.includes('?') ? '&' : '?'
			return `${config.redirectToLogin}${separator}redirect=${encodedReturnUrl}`
		}

		// Handle root path
		if (path === '/') {
			if (isAuthenticated) {
				config.redirect(302, config.redirectAuthenticated)
			} else {
				config.redirect(302, config.redirectToLogin)
			}
		}

		// If user is not authenticated and tries to access an authenticated route
		if (!isAuthenticated && isAuthenticatedRoute) {
			// Redirect to login with the current URL as the redirect target
			config.redirect(302, createLoginUrl(fullUrl))
		}

		// If user is authenticated and tries to access an anonymous-only route
		// Only check if anonymous routes are defined
		if (config.anonymous && isAuthenticated && isAnonymousRoute) {
			config.redirect(302, config.redirectAuthenticated)
		}

		return resolve(event)
	}
}
