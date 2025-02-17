import { Module } from '../../api'
import { FeedbackController } from '../FeedbackController'

type FeedbackOptions = {
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

export let FEEDBACK_OPTIONS: FeedbackOptions = {
  GITHUB_API_TOKEN: '',
  repo: { owner: '', name: '' },
}

export const feedback: (o: FeedbackOptions) => Module = (o) => {
  FEEDBACK_OPTIONS = o

  return new Module({
    name: 'feedback',
    controllers: [FeedbackController],
  })
}
