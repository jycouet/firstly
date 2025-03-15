import { remult } from 'remult'

import { Module } from '../../api'
import { FeedbackController } from '../FeedbackController'
import type { FeedbackOptions } from '../types'

export const feedback: (o: FeedbackOptions) => Module = (o) => {
	return new Module({
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
