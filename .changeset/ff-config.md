---
'firstly': minor
---

Add `<FF_Config>` (`firstly/svelte`): an SSR-safe, context-scoped provider for app-wide UI config, read by firstly components during init. First consumer is the dialog: set default `confirm` / `cancel` / `ok` labels once and your `shell` / `confirm` / `prompt` snippets in one place, instead of passing them on every `dialog.confirm(...)` / `<FF_DialogManager>`.

Precedence is explicit prop > `<FF_Config>` > built-in. Pass message **functions** (paraglide / i18next) for labels and they re-resolve on every render, so locale changes are picked up for free. `dialog.confirm` / `dialog.prompt` no longer bake `'Confirm'` / `'Cancel'` / `'OK'` at call time - omitted labels resolve at render via the nearest `<FF_Config>` (then the built-in). Also exports `ffConfig()` (read) and `setFFConfig()` (advanced).
