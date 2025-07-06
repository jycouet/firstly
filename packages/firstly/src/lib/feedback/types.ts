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
	saved?: (args: {
		number: number
		title: string
		body: string
		metadata: Record<string, any>
	}) => Promise<void>
}

export const FEEDBACK_OPTIONS: FeedbackOptions = {
	GITHUB_API_TOKEN: '',
	repo: { owner: '', name: '' },
}
