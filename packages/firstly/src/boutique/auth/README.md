---
title: Boutique - Auth
---

# 🔐 boutique / auth

> **Boutique is not a package.** Files under `boutique/*` are **recipes** you copy into your own codebase and own from then on. They wire [better-auth](https://better-auth.com) + [remult](https://remult.dev) the way we think is nice with [`firstly`](https://firstly.fun), but the moment it lives in your repo, it's yours to tweak.

## 📦 What you get

| File                            | Purpose                                                       |
| ------------------------------- | ------------------------------------------------------------- |
| `entities.ts`                   | `User`, `Session`, `Account`, `Verification` + `Roles_Auth`   |
| `roles.ts`                      | App-wide `Roles` (merges `Roles_Auth`)                        |
| `server/auth.ts`                | `betterAuth` instance wired to `remultAdapter`                |
| `server/handle.ts`              | SvelteKit `handleAuth`                                        |
| `server/module.ts`              | `auth()` remult Module (entities + `initApi` + `initRequest`) |
| `server/authHelpers.ts`         | `addRolesToUser(emails, roles)`                               |
| `svelte/components/Auth.svelte` | Sign up / Sign in / Sign out UI                               |

## 🚀 Install

### 1. Pull the folder into your project

One-liner with [`degit`](https://github.com/Rich-Harris/degit):

```bash
npx degit jycouet/firstly/packages/firstly/src/boutique/auth src/modules/auth
```

You end up with:

```
src/
└── modules/
    └── auth/
        ├── entities.ts
        ├── roles.ts
        ├── server/
        └── svelte/
```

Paths below assume `src/modules/auth`. Adjust to taste.

### 2. Register the remult module

```ts
// src/server/api.ts
import { remultSveltekit } from 'remult/remult-sveltekit'

import { SUPER_ADMIN_EMAILS } from '$env/static/private'

import { auth } from '$lib/modules/auth/server/module'

export const api = remultSveltekit({
	modules: [auth({ SUPER_ADMIN_EMAILS })],
})
```

`SUPER_ADMIN_EMAILS` is a comma-separated list. Matching users get every role from `Roles` on boot.

> Using `$env/static/private` (not `process.env`) keeps it type-checked and safely stripped from the client bundle - the SvelteKit way.

### 3. Plug the SvelteKit handle

```ts
// src/hooks.server.ts
import { sequence } from '@sveltejs/kit/hooks'

import { handleAuth } from '$lib/modules/auth/server/handle'

import { handleRemult } from './api'

export const handle = sequence(handleAuth, handleRemult)
```

### 4. Drop the component

```svelte
<script lang="ts">
	import Auth from '$lib/modules/auth/svelte/components/Auth.svelte'

	import '$lib/modules/auth/svelte/styles.css'
</script>

<Auth />
```

## 🛡️ Roles

```ts
import { Roles } from '$lib/modules/auth/roles'

// Roles.Admin          -> "admin"
// Roles.Auth_Admin     -> "Auth.Admin"  (full CRUD on auth entities)
```

Use them in your entity decorators:

```ts
@Entity('posts', { allowApiCrud: Roles.Admin })
```

## 💌 Plays well with the [mail module](./mail)

Once copied, `server/auth.ts` is yours - wire it to whatever better-auth features you need. Example: verification emails through firstly's mail module.

```ts
// src/modules/auth/server/auth.ts
export const auth = betterAuth({
	database: remultAdapter({ authEntities, usePlural: true }),

	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
	},

	emailVerification: {
		autoSignInAfterVerification: true,
		async sendVerificationEmail({ user, url }) {
			remult.context.sendMail?.('sendVerificationEmail', {
				to: user.email,
				subject: 'Welcome to our app!',
				sections: [{ html: 'Verify your email', cta: { html: 'Verify', link: url } }],
			})
		},
	},
})
```

## 🧪 Regenerating better-auth entities

If you add better-auth plugins that bring new tables, temporarily switch `server/auth.ts` to `authEntities: {}`, run `npm run auth:generate`, diff the output, then restore. See [remult-better-auth](https://github.com/nerdfolio/remult-better-auth).

## 🔗 Links

- [better-auth](https://better-auth.com)
- [remult modules](https://remult.dev/docs/modules)
- [firstly](https://firstly.fun)
