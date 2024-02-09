# remult-kit

_This is early, you should not use it ! 😉_

`remult-kit` is an opinionated way to build your application with [Remult](https://remult.github.io/remult/).

First thing first, you should do the [Remult SvelteKit tutorial](https://remult.dev/tutorials/sveltekit/) to understand the basics. Now that you know most of the things, you can use `remult-kit` to build your application and enjoy a few tweaks to make your life easier in SvelteKit.

## Installation

```bash
# Create a skeleton sveltekit app (typescript)
npm create svelte@latest remult-kit-demo

# Go to the project
cd remult-kit-demo

# add remult & remult-kit
pnpm add remult@exp remult-kit@exp @iconify-json/mdi unplugin-icons -D
```

Don't forget to add the `experimentalDecorators` in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

In `vite.config.ts` add `remultKit` plugin:

```ts
import { sveltekit } from "@sveltejs/kit/vite";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import { remultKit } from "remult-kit/vite";

export default defineConfig({
  plugins: [remultKit(), Icons({ compiler: "svelte" }), sveltekit()],
});
```

_Yes, for now, there is 0 option, you can only follow. Let's speak about it later._

```bash
# Maybe git init now?
# Generate a few files
pnpm remult-kit

# Start the dev server
pnpm dev
```

## Todos

- [ ] Add code here
- [ ] Speak about it everywhere

## Notes

- The vite plugin embeds `vite-plugin-stripper` (to help for
  Backend Methods) [info about it](https://remult.dev/docs/using-server-only-packages.html).
