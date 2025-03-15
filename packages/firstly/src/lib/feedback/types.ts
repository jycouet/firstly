export type FeedbackOptions = {
	GITHUB_API_TOKEN: string
	repo: {
		owner: string
		name: string
	}
	milestones?: {
		title_filter?: string
		labels_filters?: string[]
	}
	highlight_label?: string
	create_label?: string
}

export const FEEDBACK_OPTIONS: FeedbackOptions = {
	GITHUB_API_TOKEN: '',
	repo: { owner: '', name: '' },
}