# grid (boutique recipe)

A token-only default `Input` for firstly's headless `FF_Grid` / `FF_Form`. firstly ships **no**
styled component on purpose - copy this in and make it yours.

## Use

```bash
npx degit jycouet/firstly/packages/firstly/src/boutique/grid src/lib/ff-grid
```

Register it once at your app root so every cell of `inputType: 'text' | 'number' | 'checkbox'`
uses it:

```svelte
<script lang="ts">
	import { FF_Config } from 'firstly/svelte'

	import Input from '$lib/ff-grid/Input.svelte'
</script>

<FF_Config cell={{ inputs: { text: Input, number: Input, checkbox: Input } }}>
	{@render children()}
</FF_Config>
```

Then `<FF_Form entity={X} />` and `<FF_Grid entity={X} />` render with your input. Restyle
`Input.svelte` (or add `select` / `date` / `multiSelect` variants) to match your design system.
