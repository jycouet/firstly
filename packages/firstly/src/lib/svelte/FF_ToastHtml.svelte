<script lang="ts">
	// Internal: renders a toast description as HTML so callers can pass markup
	// (`<b>`, `<br>`, links, …). svelte-sonner renders a non-string `description`
	// as `<Description {...componentProps} />`, so we receive `html` via props.
	let { html }: { html: string } = $props()
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html html}
