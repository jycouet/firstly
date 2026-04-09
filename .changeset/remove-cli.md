---
'firstly': minor
---

BREAKING: Remove the `firstly` CLI.

The `bin` entry, the `./bin` export path, and `src/lib/bin/cmd.ts` are gone. Drops the `@clack/prompts` and `@kitql/internals` deps that only the CLI used.
