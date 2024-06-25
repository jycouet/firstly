<script>
  import Button from '../Button.svelte'
  import { dialog } from './dialog'
  import DialogForm from './DialogForm.svelte'
  import DialogPrimitive from './DialogPrimitive.svelte'

  $: dialogSorted = $dialog.sort((a, b) => a.id - b.id)
</script>

{#each dialogSorted as toShow}
  {#if toShow.type === 'confirm'}
    <DialogPrimitive
      detail={toShow.detail}
      open
      on:change={() => dialog.close(toShow.id, { success: false })}
    >
      {@html toShow.children}
      <svelte:fragment slot="actions">
        <Button class="text-white" on:click={() => dialog.close(toShow.id, { success: true })}
          >Confirmer</Button
        >
      </svelte:fragment>
    </DialogPrimitive>
  {:else if toShow.type === 'confirmDelete'}
    <DialogPrimitive
      detail={toShow.detail}
      open
      on:change={() => dialog.close(toShow.id, { success: false })}
    >
      {@html toShow.children}
      <svelte:fragment slot="actions">
        <Button
          class="btn-outline btn-error"
          on:click={() => dialog.close(toShow.id, { success: true })}
        >
          Confirmer
        </Button>
      </svelte:fragment>
    </DialogPrimitive>
  {:else if toShow.type === 'insert' || toShow.type === 'update' || toShow.type === 'view'}
    <DialogForm {toShow}></DialogForm>
  {:else if toShow.component && toShow.children}
    <DialogPrimitive
      detail={toShow.detail}
      open
      on:change={() => dialog.close(toShow.id, { success: false })}
    >
      <svelte:component this={toShow.component} {...toShow.props} dialogId={toShow.id}>
        {#if toShow.children}
          {@html toShow.children}
        {/if}
      </svelte:component>
    </DialogPrimitive>
  {:else if toShow.component}
    <DialogPrimitive
      detail={toShow.detail}
      open
      classes={{ root: toShow.classes?.root }}
      on:change={() => dialog.close(toShow.id, { success: false })}
    >
      <svelte:component this={toShow.component} {...toShow.props} dialogId={toShow.id}
      ></svelte:component>
    </DialogPrimitive>
  {:else}
    <DialogPrimitive
      detail={toShow.detail}
      open
      on:change={() => dialog.close(toShow.id, { success: false })}
    >
      <div class="grid gap-2">
        <p>Hey 🫵 developer, you are missing a few things 🤡!</p>
        <p>Or use use one of the custom built in dialog like</p>

        <pre class="bg-base-300 mt-2 p-2 text-xs">{`await dialog.confirmDelete('The Car')`}</pre>

        <p>Or pass you own component</p>
        <pre class="bg-base-300 mt-2 p-2 text-xs">{`await dialog.show({
  detail: { caption: 'Interlocuteur' },
  component: CreateCarForm,
  props: { isEdit: false },
})`}</pre>

        <p>Good luck 🚀</p>
      </div>
    </DialogPrimitive>
  {/if}
{/each}
