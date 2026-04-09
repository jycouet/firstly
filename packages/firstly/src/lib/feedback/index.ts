import { FeedbackController } from './FeedbackController'
import type { FeedbackOptions } from './types'
import { default as Feedback } from './ui/Feedback.svelte'

export { FeedbackController, Feedback }

declare module 'remult' {
	export interface RemultContext {
		feedbackOptions: FeedbackOptions
	}
}
