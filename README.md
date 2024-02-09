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
pnpm add remult@exp remult-kit@exp -D

# Now you should probably git init & commit.
# GIT GIT GIT

# Then run => Generate a few files
pnpm remult-kit

# Start the dev server
pnpm dev
```

## Concepts

- Store `kitStoreList` to manage list
- Store `kitStoreItem` to manage item
- Using `Field` component to display a remult field
- `KitBaseEnum` to create an enum
- `KitBaseItemLight` to hold a "magic" object usefull in many situations
- `kitBuilder` to build forms!
- `dialog`

OMG, we have so much to explain :) It will be fun!

## FAQ

- Why `remultKit` \* 3 ?
  - `remultKit` from `remult-kit/vite` => for vite `vite.config.ts`
  - `remultKit` from `remult-kit/api` => for route `./src/routes/[...remult].ts`
  - `remultKit` from `remult-kit/handle` => for `hooks.servers.ts`

## Todos

- [ ] Add code here
- [ ] Speak about it everywhere

## Notes

- The vite plugin embeds `vite-plugin-stripper` (to help for
  Backend Methods) [info about it](https://remult.dev/docs/using-server-only-packages.html).
