# `firstly/svelte/ui`

A small set of [shadcn-svelte]-flavoured Svelte 5 components (Button, Input, Card, Badge)
shipped as part of [`firstly`](https://firstly.fun). Designed to be dropped into any
SvelteKit + Tailwind v4 project.

## Requirements

- Svelte `>=5`
- SvelteKit `>=2` (optional — the components work with plain Svelte too)
- Tailwind CSS `>=4`

The runtime peer packages `bits-ui`, `tailwind-variants`, `clsx` and `tailwind-merge` are
installed transitively by `firstly`. You can still install them explicitly in your app to
pin versions / dedupe.

## Install

### 1. Add Tailwind v4 via the Svelte CLI

Inside your SvelteKit project, run the official [`sv`] add-on — it installs
`tailwindcss` + `@tailwindcss/vite`, wires the Vite plugin, creates `src/app.css`,
and imports it from `src/routes/+layout.svelte` for you:

```bash
npx sv add tailwindcss
```

Need the optional plugins? Append them:

```bash
npx sv add tailwindcss=plugins:typography+forms
```

> If you prefer manual setup, `pnpm add -D tailwindcss @tailwindcss/vite` then
> register `tailwindcss()` in `vite.config.ts` alongside `sveltekit()` — but
> `sv add` is the supported path and keeps you aligned with upstream changes.

### 2. Add `firstly`

```bash
pnpm add firstly
# or: npm i firstly / yarn add firstly / bun add firstly
```

## Set up the theme

The components use CSS variables (`--background`, `--primary`, `--muted-foreground`, …) that
you can either own yourself or import from the library.

Append the theme import to the `src/app.css` that `sv add tailwindcss` generated:

```css
@import 'tailwindcss';
@import 'firstly/svelte/ui/theme.css';
```

No other wiring is needed — `sv add tailwindcss` already imports `app.css` from your
root layout.

Dark mode is keyed off a `.dark` class (via `@custom-variant dark`). Toggle it on
`<html>` / `<body>` with your preferred mode manager (e.g. [`mode-watcher`]).

### Customising tokens

Copy the `:root` and `.dark` blocks from `theme.css` into your own CSS and adjust the
OKLCH values — the components just read `var(--primary)` etc., so any override takes
effect immediately.

## Usage

### Named imports from the barrel

```svelte
<script lang="ts">
	import { Button, Input, Badge, Card } from 'firstly/svelte/ui'
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Sign in</Card.Title>
		<Card.Description>Use your email and password.</Card.Description>
	</Card.Header>
	<Card.Content class="flex flex-col gap-3">
		<Input type="email" placeholder="Email" />
		<Input type="password" placeholder="Password" />
		<div class="flex gap-2">
			<Button>Sign In</Button>
			<Button variant="outline">Sign Up</Button>
			<Badge variant="success">Ready</Badge>
		</div>
	</Card.Content>
</Card.Root>
```

### Per-component imports (better tree-shaking)

```ts
import { Button, buttonVariants, type ButtonProps } from 'firstly/svelte/ui/button'
import { Input } from 'firstly/svelte/ui/input'
import * as Card from 'firstly/svelte/ui/card'
import { Badge, badgeVariants } from 'firstly/svelte/ui/badge'
```

### `cn` utility

A thin wrapper over `clsx` + `tailwind-merge`:

```ts
import { cn } from 'firstly/svelte/ui' // or: 'firstly/utils'

const cls = cn('px-4 py-2', isActive && 'bg-primary', className)
```

## Component reference

### Button

```svelte
<Button variant="default" size="default" href="/docs" onclick={fn}>Label</Button>
```

| prop      | type                                                                              | default     |
| --------- | --------------------------------------------------------------------------------- | ----------- |
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'`     | `'default'` |
| `size`    | `'default' \| 'sm' \| 'lg' \| 'icon'`                                             | `'default'` |
| `href`    | `string`                                                                          | —           |
| `class`   | `string`                                                                          | —           |
| `ref`     | bindable element ref                                                              | `null`      |

If `href` is provided the component renders an `<a>`, otherwise a `<button type="button">`.
All standard button/anchor attributes pass through.

### Input

Drop-in `<input>` replacement. Supports `bind:value`, `bind:files` (for `type="file"`),
and everything `HTMLInputElement` accepts.

```svelte
<Input type="email" bind:value={email} placeholder="you@firstly.fun" />
```

### Card

Sub-components you compose:

```svelte
<Card.Root>
	<Card.Header>
		<Card.Title>Title</Card.Title>
		<Card.Description>Subtitle</Card.Description>
	</Card.Header>
	<Card.Content>…</Card.Content>
</Card.Root>
```

### Badge

```svelte
<Badge variant="default">New</Badge>
<Badge variant="success">Ready</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Tag</Badge>
```

Variants: `default | secondary | destructive | outline | success`.
Pass `href` to render an `<a>` instead of a `<span>`.

## FAQ

**Can I override Tailwind classes?**
Yes — pass `class="..."` and it's merged via `tailwind-merge`, so later utilities win.

**Do I have to use Tailwind v4?**
Yes. The theme relies on `@theme inline` and `@custom-variant`, both v4-only.

**Does it ship with icons?**
No. Icons in the demo app use inline SVG; bring your own icon library (e.g.
`@lucide/svelte`, `heroicons`, `@mdi/js`).

[shadcn-svelte]: https://shadcn-svelte.com
[`mode-watcher`]: https://github.com/svecosystem/mode-watcher
[`sv`]: https://github.com/sveltejs/cli
