<script lang="ts">
  import { page } from '$app/state'

  import { AuthController } from '../../../firstly/src/lib/auth'
  import Field from './Field.svelte'
  import { route } from './ROUTES'

  interface Props {
    mode: 'sign-in' | 'sign-up' | 'forgot-password'
    email?: string
  }

  let { email = page.url.searchParams.get('email') ?? '', mode = 'sign-in' }: Props = $props()

  let password = $state('')
  let globalError = $state('')

  let title = $derived(
    mode === 'sign-in' ? 'Sign In' : mode === 'sign-up' ? 'Sign Up' : 'Forgot Password',
  )
  let buttonText = $derived(
    mode === 'sign-in' ? 'Sign In' : mode === 'sign-up' ? 'Sign Up' : 'Send by mail',
  )

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    try {
      await AuthController.signInPassword(email, password)
    } catch (error) {
      // @ts-ignore
      if (error && error.message) {
        // @ts-ignore
        globalError = error.message
      }
    }
  }
</script>

<div class="card bg-base-200 text-primary-content">
  <div class="card-body">
    <h2 class="card-title">{title}</h2>
    {#if mode === 'sign-in'}
      <p class="text-base-content/50 text-sm">
        Not a member ? <a href={route('/auth/sign-up', { email })} class="link link-primary"
          >Sign Up</a
        >
      </p>
    {:else if mode === 'sign-up'}
      <p class="text-base-content/50 text-sm">
        Already a member ? <a href={route('/auth', { email })} class="link link-primary">Sign In</a>
      </p>
    {/if}

    <form onsubmit={handleSubmit} class="mt-2 flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <Field
          id="email"
          label="Email"
          type="text"
          error=""
          bind:value={email}
          placeholder="Email"
        />

        {#if mode === 'sign-in' || mode === 'sign-up'}
          <Field
            id="password"
            label="Password"
            type="password"
            error=""
            bind:value={password}
            placeholder="Password"
          />
        {/if}
      </div>

      {#if globalError}
        <span class="text-error text-right">{globalError}</span>
      {:else}
        <span>&nbsp;</span>
      {/if}

      <div class="card-actions items-center justify-between">
        {#if mode === 'sign-in'}
          <a href={route('/auth/forgot-password', { email })} class="link link-primary"
            >Forgot password?</a
          >
        {:else if mode === 'forgot-password'}
          <a href={route('/auth', { email })} class="link link-primary">Sign In</a>
        {:else}
          <span>&nbsp;</span>
        {/if}

        <button class="btn btn-primary">{buttonText}</button>
      </div>
    </form>
  </div>
</div>
