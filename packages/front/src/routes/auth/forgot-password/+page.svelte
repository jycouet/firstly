<script lang="ts">
  import Auth from '$lib/Auth.svelte'
</script>

<div class="hero bg-base-100 min-h-screen">
  <div class="hero-content w-full max-w-4xl flex-col gap-8 lg:flex-row-reverse">
    <div class="w-full max-w-md flex-1">
      <Auth mode="forgot-password" />
    </div>
  </div>
</div>
