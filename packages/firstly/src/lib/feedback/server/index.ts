import { remult } from 'remult'
import { Module } from 'remult/server'

import { FeedbackController } from '../FeedbackController'
import type { FeedbackOptions } from '../types'

export const feedback: (o: FeedbackOptions) => Module<unknown> = (o) => {
	return new Module({
		key: 'feedback',
		controllers: [FeedbackController],
		initRequest: async () => {
			remult.context.feedbackOptions = o
		},
	})
}
