---
title: Module - Cron
---

You wan to execute a function regularly? This module is for you! It's using
[cron](https://www.npmjs.com/package/cron) package in the background with a few things on top _(You
start to be used to it in firstly 😉)_.

Here is how to play with it:

```ts
import { cron, cronTime } from 'firstly/cron'

export const api = firstly({
  modules: [
    cron([
      {
        // REQUIRED
        topic: 'first_cron', // Will be used for logs
        cronTime: cronTime.every_second, // You can use the cron syntax `* * * * * *` or some built in helpers.
        onTick: () => {
          console.log('hello')
        },
        // onTick: fnUpdateFormSomewhereElse // Usually doing this in real life !

        // OPTIONAL (but you want them 😉)
        start: !dev // Start in production
        // runOnInit: dev, // nice in dev environement

        // OPTIONAL
        concurrent: 1, // Default is 1, if we are at the limit, the job will be skipped.
        logs: {}, // to log more or less stuff, I let you look the ts definition.
      }
    ])
  ]
})
```
