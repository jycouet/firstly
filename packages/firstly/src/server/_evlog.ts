import { evlog } from 'firstly/evlog/server'

export const ev = evlog({
	service: 'firstly-demo',
	context: { userAgent: true },
})
