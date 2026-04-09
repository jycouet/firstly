import { FeedbackController } from './FeedbackController'
import type { FeedbackOptions } from './types'

export { FeedbackController }

declare module 'remult' {
	export interface RemultContext {
		feedbackOptions: FeedbackOptions
	}
}
