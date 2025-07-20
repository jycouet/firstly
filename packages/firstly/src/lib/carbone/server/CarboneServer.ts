import { log } from '..'

export class CarboneServer {
	api_key: string
	api_url: string
	api_version: '5'
	test: boolean

	constructor(options: {
		CARBONE_API_KEY?: string
		api_url?: string
		api_version?: '5'
		test?: boolean
	}) {
		this.api_key = options.CARBONE_API_KEY ?? ''
		this.api_url = options.api_url ?? 'https://api.carbone.io'
		this.api_version = options.api_version ?? '5'
		this.test = options.test ?? false
	}

	private getHeaders = (headersInit?: HeadersInit) => {
		if (this.api_key === undefined || this.api_key === '') {
			log.error('Token CARBONE_API_TOKEN not defined!')
			throw new Error('Configuration error')
		}

		const headers = new Headers(headersInit)
		headers.append('Authorization', 'Bearer ' + this.api_key)
		headers.append('Carbone-version', this.api_version)
		// headers.append('Carbone-version', 'staging')
		headers.append('Content-type', 'application/json')

		return headers
	}

	fetch = async (o: {
		api: string
		body?: string
		method?: 'POST' | 'GET' | 'DELETE'
		headers?: HeadersInit
	}) => {
		const response = await fetch(`${this.api_url}${o.api}`, {
			method: o.method ?? 'POST',
			headers: this.getHeaders(o.headers),
			body: o.body,
		})

		if (!response.ok) {
			const errorText = await response.text()
			log.error(`Carbone render failed`, {
				status: response.status,
				statusText: response.statusText,
				error: errorText,
			})
			throw new Error(`Carbone render failed`)
		}

		return response
	}
}
