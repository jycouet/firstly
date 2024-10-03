import { Allow, BackendMethod, remult } from 'remult'
import { stry } from '@kitql/helpers'

import { FEEDBACK_OPTIONS } from '.'

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql'

async function getGitHub(query: string, variables?: Record<string, any>) {
  if (!FEEDBACK_OPTIONS.GITHUB_API_TOKEN) {
    throw new Error('GITHUB_API_TOKEN not found in .env')
  }

  try {
    const headers: Headers = new Headers({
      Authorization: 'Bearer ' + FEEDBACK_OPTIONS.GITHUB_API_TOKEN,
      'Content-Type': 'application/json',
    })
    const body = stry({ query, variables }, 0)
    const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, { method: 'POST', headers, body })
    const result = await response.json()
    if (result.errors) {
      console.error(`result ERRORS`, body, stry(result))
    }
    return result.data
  } catch (error) {
    console.error(`error`, error)
  }
  return null
}

async function addMetaData(issueId: string, author: string | undefined, page: string) {
  const commentToMinimize = await getGitHub(
    `mutation AddComment($input: AddCommentInput!) {
			addComment(input: $input) {
				commentEdge {
					node {
						id
					}
				}
			}
		}
		`,
    {
      input: {
        subjectId: issueId,
        body: `<pre>\n${JSON.stringify({ author, page }, null, 2)}\n</pre>`,
      },
    },
  )

  await getGitHub(
    `mutation MinimizeComment($input: MinimizeCommentInput!) {
			minimizeComment(input: $input) {
				minimizedComment {
					isMinimized
				}
			}
		}
		`,
    {
      input: {
        subjectId: commentToMinimize.addComment.commentEdge.node.id,
        classifier: 'OFF_TOPIC',
      },
    },
  )
}

export class FeedbackController {
  @BackendMethod({ allowed: Allow.authenticated })
  static async getMilestones() {
    const data = await getGitHub(
      `query Milestones(
			$repository: String!
			$owner: String!
			$filter: String
			$take: Int = 25
			$cursor: String
		) {
			repository(name: $repository, owner: $owner) {
				milestones(query: $filter, last: $take, after: $cursor, states: OPEN) {
					pageInfo {
						endCursor
					}
					nodes {
						id
						number
						title
					}
				}
			}
		}
		`,
      {
        repository: FEEDBACK_OPTIONS.repo.name,
        owner: FEEDBACK_OPTIONS.repo.owner,
        filter: FEEDBACK_OPTIONS.milestones?.title_filter ?? '',
      },
    )
    return (
      data.repository.milestones.nodes as { id: string; number: number; title: string }[]
    ).map((c) => {
      return {
        ...c,
        title: c.title.replaceAll(FEEDBACK_OPTIONS.milestones?.title_filter ?? '', '').trim(),
      }
    })
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async getIssues(milestoneNumber: number, issueState: 'OPEN' | 'CLOSED') {
    const issueOrder =
      issueState === 'CLOSED'
        ? { field: 'UPDATED_AT', direction: 'DESC' } // When close, the last issue updated.
        : null // When open take milestone order
    const data = await getGitHub(
      `query Issues(
				$repository: String!
				$owner: String!
				$filters: IssueFilters
				$milestoneNumber: Int!
				$take: Int = 25
				$cursor: String
				$issueOrder: IssueOrder
			) {
				repository(name: $repository, owner: $owner) {
					milestone(number: $milestoneNumber) {
						issues(first: $take, after: $cursor, filterBy: $filters, orderBy: $issueOrder) {
							nodes {
								id
								number
								titleHTML
								state
                labels(first:10){
                  nodes {
                    name
                  }
                }
							}
						}
					}
				}
			}			
		`,
      {
        repository: FEEDBACK_OPTIONS.repo.name,
        owner: FEEDBACK_OPTIONS.repo.owner,
        milestoneNumber,
        filters: {
          labels: FEEDBACK_OPTIONS.milestones?.labels_filters ?? [],
          states: [issueState],
        },
        issueOrder,
      },
    )

    return data.repository.milestone.issues.nodes.map((issue: any) => {
      const hasWaitingForAnswerLabel = FEEDBACK_OPTIONS.highlight_label
        ? issue.labels.nodes.some((label: any) =>
            label.name.includes(FEEDBACK_OPTIONS.highlight_label),
          )
        : false
      return {
        id: issue.id,
        number: issue.number,
        titleHTML: issue.titleHTML,
        state: issue.state,
        highlight: hasWaitingForAnswerLabel,
      }
    }) as { id: string; number: number; titleHTML: string; state: string; highlight: boolean }[]
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async getIssue(issueNumber: number) {
    const data = await getGitHub(
      `query Issue($repository: String!, $owner: String!, $issueNumber: Int!) {
				repository(name: $repository, owner: $owner) {
					issue(number: $issueNumber) {
						id
						createdAt
						bodyHTML
						state
            labels(first: 25){
              nodes{
                id
                name
              }
            }
						comments(first: 100) {
							nodes {
								id
								isMinimized
								createdAt
								body
								bodyHTML
								reactionGroups {
									content
									reactors(first: 1) {
										totalCount
									}
								}
							}
						}
					}
				}
			}
		`,
      {
        repository: FEEDBACK_OPTIONS.repo.name,
        owner: FEEDBACK_OPTIONS.repo.owner,
        issueNumber,
      },
    )

    type Item = { bodyHTML: string; who?: string; createdAt: Date; public: boolean }
    const items: Item[] = []
    const firstItem: Item = {
      bodyHTML: data.repository.issue.bodyHTML,
      createdAt: data.repository.issue.createdAt,
      public: true,
    }
    items.push(firstItem)

    const comments = data.repository.issue.comments.nodes as {
      id: string
      isMinimized: boolean
      createdAt: string
      body: string
      bodyHTML: string
      reactionGroups: [
        { content: 'THUMBS_UP'; reactors: { totalCount: number } },
        { content: 'THUMBS_DOWN'; reactors: { totalCount: number } },
        { content: 'LAUGH'; reactors: { totalCount: number } },
        { content: 'HOORAY'; reactors: { totalCount: number } },
        { content: 'CONFUSED'; reactors: { totalCount: number } },
        { content: 'HEART'; reactors: { totalCount: number } },
        { content: 'ROCKET'; reactors: { totalCount: number } },
        { content: 'EYES'; reactors: { totalCount: number } },
      ]
    }[]

    for (let i = 0; i < comments.length; i++) {
      if (comments[i].isMinimized) {
        const parsed = JSON.parse(
          comments[i].body.replaceAll('<pre>\n', '').replaceAll('\n</pre>', ''),
        )
        items[items.length - 1].who = parsed.author
        items[items.length - 1].public = true
      } else {
        const nbEye = comments[i].reactionGroups.find((c) => c.content === 'EYES')?.reactors
          .totalCount

        items.push({
          bodyHTML: comments[i].bodyHTML,
          createdAt: new Date(comments[i].createdAt),
          public: nbEye && nbEye > 0 ? true : false,
        })
      }
    }

    const hasWaitingForAnswerLabel = FEEDBACK_OPTIONS.highlight_label
      ? data.repository.issue.labels.nodes.some((label: any) =>
          label.name.includes(FEEDBACK_OPTIONS.highlight_label),
        )
      : false

    const toRet = {
      id: data.repository.issue.id,
      state: data.repository.issue.state,
      items: items.filter((c) => c.public),
      labels: data.repository.issue.labels.nodes,
      highlight: hasWaitingForAnswerLabel,
    }
    return toRet
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async createIssue(milestoneId: string, title: string, body: string, page: string) {
    const repoInfo = await getGitHub(
      `query RepoInfo(
				$repository: String!
				$owner: String!
			) {
				repository(name: $repository, owner: $owner) {
					id
          labels(first: 25){
            nodes{
              id
              name
            }
          }
				}
			}`,
      {
        repository: FEEDBACK_OPTIONS.repo.name,
        owner: FEEDBACK_OPTIONS.repo.owner,
      },
    )

    const repoInfoData = repoInfo.repository as {
      id: string
      labels: { nodes: { id: string; name: string }[] }
    }

    const create_label = repoInfoData.labels.nodes.find(
      (c) => c.name === FEEDBACK_OPTIONS.create_label,
    )

    const newIssue = await getGitHub(
      `mutation CreateIssue($input: CreateIssueInput!) {
			createIssue(input: $input) {
				issue {
					id
					number
				}
			}
		}
		`,
      {
        input: {
          repositoryId: repoInfoData.id,
          milestoneId: milestoneId,
          labelIds: [create_label?.id],
          title: title ?? 'New Feedback (wo title...)',
          body: body,
        },
      },
    )

    const toRet = newIssue.createIssue.issue as { id: string; number: number }

    await addMetaData(toRet.id, remult.user?.name, page)

    return toRet
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async addCommentOnIssue(
    issueId: string,
    body: string,
    page: string,
    labels: { id: string; name: string }[],
  ) {
    const inputComment: { subjectId: string; body: string } = {
      subjectId: issueId,
      body,
    }

    const inputIssue: { id: string; labelIds: string[] } = {
      id: issueId,
      labelIds: (FEEDBACK_OPTIONS.highlight_label
        ? labels.filter((c) => c.name !== FEEDBACK_OPTIONS.highlight_label)
        : labels
      ).map((c) => c.id),
    }

    await getGitHub(
      `mutation AddComment($inputComment: AddCommentInput!, $inputIssue: UpdateIssueInput!) {
				addComment(input: $inputComment) {
					commentEdge {
						node {
							id
						}
					}
				}
        updateIssue(input: $inputIssue) {
          issue {
            id
          }
        }
			}
			`,
      {
        inputComment,
        inputIssue,
      },
    )

    await addMetaData(issueId, remult.user?.name, page)

    return 'done'
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async close(issueId: string, labels: { id: string; name: string }[]) {
    const inputClose: { issueId: string } = {
      issueId,
    }

    const inputIssue: { id: string; labelIds: string[] } = {
      id: issueId,
      labelIds: (FEEDBACK_OPTIONS.highlight_label
        ? labels.filter((c) => c.name !== FEEDBACK_OPTIONS.highlight_label)
        : labels
      ).map((c) => c.id),
    }

    await getGitHub(
      `mutation CloseIssue($inputIssue: UpdateIssueInput!, $inputClose: CloseIssueInput!) {
        updateIssue(input: $inputIssue) {
          issue {
            id
          }
        }
				closeIssue(input: $inputClose) {
					issue {
						id
					}
				}
			}
			`,
      {
        inputIssue,
        inputClose,
      },
    )

    return 'done'
  }

  @BackendMethod({ allowed: Allow.authenticated })
  static async reOpen(issueId: string) {
    const input: { issueId: string } = {
      issueId,
    }

    await getGitHub(
      `mutation ReOpenIssue($input: ReopenIssueInput!) {
				reopenIssue(input: $input) {
					issue {
						id
					}
				}
			}
			`,
      {
        input,
      },
    )

    return 'done'
  }
}
