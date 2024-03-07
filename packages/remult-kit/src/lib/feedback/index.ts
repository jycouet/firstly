import type { Module } from '../api'
import { FeedbackController } from './FeedbackController'
import { default as Feedback } from './ui/Feedback.svelte'

export { FeedbackController, Feedback }

type FeedbackOptions = {
	repo: {
		owner: string
		name: string
	}
	milestones?: {
		title_filter?: string
		labels_filters?: string[]
	}
	create_label?: string
}

export let FEEDBACK_OPTIONS: FeedbackOptions = { repo: { owner: '', name: '' } }

export const feedback: (o: FeedbackOptions) => Module = (o) => {
	FEEDBACK_OPTIONS = o

	return {
		name: 'feedback',
		controllers: [FeedbackController],
	}
}
