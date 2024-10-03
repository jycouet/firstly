<script lang="ts">
  import { onMount } from 'svelte'

  import { repo } from 'remult'

  import { page } from '$app/stores'

  import { FeedbackController } from '..'
  import { Button, cellBuildor, Field, FilterEntity, Loading, type ResolvedType } from '../..'
  import Textarea from '../../ui/internals/Textarea.svelte'

  export let dialogId: number
  const rmvWarning = dialogId

  export let milestoneId: string
  export let issueNumber: number | null

  let state: 'loading' | 'done' = 'loading'

  let issue: ResolvedType<ReturnType<typeof FeedbackController.getIssue>> | undefined

  const update = async () => {
    state = 'loading'
    if (issueNumber) {
      issue = await FeedbackController.getIssue(issueNumber)
    }
    state = 'done'
  }

  onMount(async () => {
    await update()
  })

  let title: ''
  let content: ''
  const send = async () => {
    state = 'loading'

    const p = $page.url.pathname + $page.url.search
    if (!issue?.id) {
      const result = await FeedbackController.createIssue(milestoneId, title, content, p)
      issueNumber = result.number
    } else {
      await FeedbackController.addCommentOnIssue(issue.id, content, p, issue.labels)
    }

    content = ''
    await update()
    state = 'done'
  }

  const close = async () => {
    state = 'loading'
    await FeedbackController.close(issue!.id, issue!.labels)
    content = ''
    await update()
    state = 'done'
  }

  const reOpen = async () => {
    state = 'loading'
    await FeedbackController.reOpen(issue!.id)
    content = ''
    await update()
    state = 'done'
  }

  const disableButton = (issueNumber: number | null, title: string, content: string) => {
    if (issueNumber) {
      if (content?.length > 2) {
        return false
      }
    }
    if (title?.length > 2 && content?.length > 2) {
      return false
    }
    return true
  }
</script>

<div class="mb-4 grid gap-4">
  {#if state === 'loading'}
    <Loading class="h-12"></Loading>
    <Loading class="h-12"></Loading>
    <Loading class="h-12"></Loading>
  {:else}
    {#each issue?.items ?? [] as item}
      <div class="chat {item.who ? 'chat-start' : 'chat-end'}">
        <div class="avatar chat-image">
          <div class="w-10 rounded-full">
            <div class="h-10 w-10 {item.who ? 'bg-primary' : 'bg-secondary'}"></div>
          </div>
        </div>
        <div class="chat-header">
          {item.who ?? 'Support'}
          <time class="text-xs opacity-50"
            >{new Date(item.createdAt).toLocaleDateString()} - {new Date(
              item.createdAt,
            ).toLocaleTimeString()}</time
          >
        </div>
        <div class="chat-bubble prose">{@html item.bodyHTML}</div>
        <!-- <div class="chat-footer opacity-50">Delivered</div> -->
      </div>
    {/each}
    {#if issue?.highlight && issue.state === 'OPEN'}
      <span class="badge badge-warning">En attente de réponse de TA part 😉, oui 🫵!</span>
    {/if}
    {#if issueNumber}
      <button on:click={update} class="divider"></button>
    {/if}

    {#if issue?.state === 'CLOSED'}
      <div class="flex justify-end">
        <Button on:click={reOpen} class="btn-neutral">Re Ouvrir</Button>
      </div>
    {:else}
      {#if issueNumber === null}
        <Field cell={cellBuildor(repo(FilterEntity), 'title')} bind:value={title} />
      {/if}
      <Textarea bind:value={content} placeholder="Un peu de détail c'est pas mal... Fais toi Plaiz'"
      ></Textarea>
      <div class="flex justify-between">
        {#if issueNumber}
          <Button on:click={close} tabIndex={-1} class="btn-outline btn-error"
            >Clore le feedback</Button
          >
        {:else}
          <div></div>
        {/if}
        <Button on:click={send} disabled={disableButton(issueNumber, title, content)}
          >Envoyer</Button
        >
      </div>
    {/if}
  {/if}
</div>
