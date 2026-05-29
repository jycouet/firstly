---
'firstly': minor
---

Add a headless async `dialog` layer (`firstly/svelte`): `dialog.show(body)`, `dialog.confirm(message)`, `dialog.prompt(opts)`, rendered through a single `<FF_DialogManager>` you mount once. Built-in defaults are theme-adaptive via semantic Tailwind tokens; pass `shell` / `confirm` / `prompt` snippets to fully restyle. Ships `ffAutofocus`, Escape/scroll-lock/stacking, and a `LocalizedMessage` (string or fn) for labels. `dialog.open(Component, { props })` opens a dialog from a component + props, inferring the result type from the component's `close: DialogClose<T>` prop (no call-site generic).

One result contract for all three: they resolve a `DialogResult` (`{ ok: true, data } | { ok: false }`). `confirm` carries no `data` (read `.ok`); `prompt`'s `data` is the trimmed string (so cancel vs empty-string is unambiguous - `{ ok: false }` vs `{ ok: true, data: '' }`); `show<T>` carries `T`. See `/docs/svelte/dialog`.
