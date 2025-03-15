export type FirstlyData = {
	module: 'auth'
	debug?: boolean
	props: FirstlyDataAuth
}

export type FirstlyDataAuth = {
	ui?: {
		paths: {
			base: string
			sign_up: string | false
			sign_in: string | false
			forgot_password: string | false
			reset_password: string | false
			verify_email: string | false
		}
		strings: {
			app_name: string
			email: string
			email_placeholder: string
			password: string
			password_placeholder: string
			confirm: string
			reset: string
			btn_sign_in: string
			btn_sign_up: string
			forgot_password: string
			send_password_reset_instructions: string
			back_to_sign_in: string
		}
		images: {
			main: string
		}
	}
}

export type ProviderConfigured = Record<string, ProviderAuthorizationURLOptions>
export type ProviderAuthorizationURLOptions = string[]
