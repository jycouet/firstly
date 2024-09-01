---
title: Why ? 
---

If [remult](https://remult.dev/) is so good, why do we need `firstly`?

- _Firstly_, because is not replacing it, it's just some helpers to seepdrun web apps.
An app with `firstly` has as a peer dependency `remult` and `sveltekit` and it's not a replacement for them!
So knowing `remult` is needed (find here the [SvelteKit Tutorial](https://remult.dev/tutorials/sveltekit/)).
In a few places, you will still:
```ts
import { repo } from 'remult'
```


- _Firstly_, we can iterate on a few ideas that will eventually fall into `remult` if they are good enough, and not only applicable to `sveltekit`. One good example is `Modules`.
```ts
// today in remult & sveltekit
export const _api = remultSveltekit({
  entities: [Task],
  controllers: [TaskController]
})

// today in firslty & sveltekit
export const _api = firstly({
  modules: [
    {
      name: "module-task",
      entities: [Task],
      controllers: [TaskController]
    }
  ]
})
```

We belive that Module Development Driven _(MDD 😎)_ is a good idea as we can easily reuse module in different projects. Module can also be developped by the community and grow the ecosystem around remult. Imagine: sharing entities, controllers, and even ui in ONE import.

You want a login/password auth in your app, here is the code you need in `firstly` today:
```ts
export const remultApi = firstly({
  modules: [
    auth({
      password: {}
    })
  ]
})
```
**YES, THAT'S IT!!! 🎉** _Read more about it [here](/modules/auth)_.

- _Firstly_, we provide stores _(one day runes)_ that wrap remult `repo` to make it easy to work with. Check out `storeList`, `storeItem`, `cellBuildor`... and more to come. (Also more to come on the doc!)