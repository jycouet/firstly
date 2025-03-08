---
title: Core Module - Mail
---

## Usage

To it's core, `firstly` provides you the ability to send emails. For this, we didn't reinvent the
wheel and use the great [nodemailer](https://nodemailer.com/) package.

Anywhere in your code you can then:

```ts
import { sendMail } from 'firstly/mail'

await sendMail('my_first_mail', {
	to: '...@...',
	subject: 'Hello from firstly',
	html: 'hello <b>hello</b> 👋',
})
```

By default, firstly will create a demo account on [ethereal.email](https://ethereal.email/), this
will **NEVER** send a real email, but you can see the email sent in the ethereal dashboard. You also
get a link to the email preview in the console.

## Use the template

Instead of passing the `html` param, you can pass `templateProps`, and it will use a nice default
template.

```ts
await sendMail('my_second_mail', {
	to: '...@...',
	subject: 'Hello from firstly (a second time)',

	templateProps: {
		title: 'firstly 👋',
		previewText: 'This is the mail you were waiting for',
		sections: [
			{
				text: 'Then, How are you today ?',
				highlighted: true,
			},
			{
				text: 'Did you star the repo ?',
				cta: {
					text: 'Check it out',
					link: 'https://github.com/jycouet/firstly',
				},
			},
		],
	},
})
```

# How to really send email ?

## Manually configure your service

```ts
export const api = firstly({
	mail: {
		transport: {
			host: '...',
			port: 587,
			secure: false, // Use `true` for port 465, `false` for all other ports
			auth: {
				user: '...',
				pass: '...',
			},
		},
	},
})
```

## Service sendgrid example

or you can use another transport like
[nodemailer-sendgrid](https://www.npmjs.com/package/nodemailer-sendgrid):

```ts
import nodemailerSendgrid from 'nodemailer-sendgrid'

import { SENDGRID_API_KEY } from '$env/static/private'

export const api = firstly({
	mail: {
		transport: nodemailerSendgrid({
			apiKey: SENDGRID_API_KEY,
		}),
	},
})
```

## Other params

```ts
export const api = firstly({
  mail: {
    // Like this you don't need to pass the `from` param in every call
    from: {
      name: 'My Cool App',
      address: 'noreply@coolApp.io'
    }
    template: {
      // Using https://github.com/cmjoseph07/svelty-email
      component: AnySvelteComponent
      // to match your own branding
      brandColor: '#E10098'
    }
  }
})
```
