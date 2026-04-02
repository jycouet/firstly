---
'firstly': minor
---

BREAKING: Remove deprecated lucia-style auth module (`firstly/auth`, `firstly/auth/server`).

Migrate to `better-auth` (see remult docs). Removed deps: `@oslojs/*`, `arctic`, `bcryptjs`.
Also removed `packages/ui` (was only used for the auth UI).
