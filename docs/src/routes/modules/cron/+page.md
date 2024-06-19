---
title: Module cron
---

You wan to execute a function regularly? This module is for you!

```ts
import { cron, cronTime } from 'remult-kit/cron'

export const api = remultKit({
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
