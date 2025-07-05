import { remult } from 'remult'

import { ModuleFF } from '../../server'
import { FeedbackController } from '../FeedbackController'
import type { FeedbackOptions } from '../types'

export const feedback: (o: FeedbackOptions) => ModuleFF = (o) => {
	return new ModuleFF({
		name: 'feedback',
		controllers: [FeedbackController],
		initRequest: async (kitEvent, op) => {
			remult.context.feedbackOptions = o
		},
	})
}

declare module 'remult' {
	export interface RemultContext {
		feedbackOptions: FeedbackOptions
	}
}
