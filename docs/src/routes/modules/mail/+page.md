---
title: Core Module - Mail
---

To it's core, `remult-kit` provides you the ability to send emails. For this, we didn't reinvent the
wheel and use the great [nodemailer](https://nodemailer.com/) package.

Anywhere in your code you can then:

```ts
import { sendMail } from 'remult-kit/mail'

await sendMail('my_first_mail', {
  to: '...@...',
  subject: 'Hello from remult-kit',
  test: 'hello hello 👋',
  html: 'hello <b>hello</b> 👋'
})
```

By default, remult-kit will create a demo on the fly account, of couse, you will need to configure
the mailer And use your own credentials:

Something like _(nodemailer example)_:

```ts
export const api = remultKit({
  mail: {
    transport = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: "maddison53@ethereal.email",
        pass: "jn7jnAPss4f63QBp6D",
      },
    })
  }
})
```

## Other transport

or you can use another transport like
[nodemailer-sendgrid](https://www.npmjs.com/package/nodemailer-sendgrid):

```ts
import nodemailerSendgrid from 'nodemailer-sendgrid'

import { SENDGRID_API_KEY } from '$env/static/private'

export const api = remultKit({
  mail: {
    transport: nodemailerSendgrid({
      apiKey: SENDGRID_API_KEY
    })
  }
})
```

## Other params

```ts
export const api = remultKit({
  mail: {
    // Like this you don't need to pass the `from` param in every call
    from: {
      name: 'My Cool App',
      address: 'noreply@coolApp.io'
    }
  }
})
```
