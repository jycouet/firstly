---
'firstly': minor
---

BREAKING: Remove the deprecated internal `sveltekit` module and the `RemultContext.setHeaders` / `setCookie` / `deleteCookie` augmentation it set up.

Nothing consumed those context methods. The module itself was marked `@deprecated` and was only auto-wired through `firstly({ ... })`. `remult.context.request` (the `RequestEvent`) is still augmented, so headers and cookies can be set via `remult.context.request.setHeaders(...)` / `remult.context.request.cookies.set(...)` directly.
