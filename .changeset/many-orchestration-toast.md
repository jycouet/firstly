---
'firstly': patch
---

Add `many` action+confirm orchestration and a `toast` (`firstly/svelte`):

- `ff(E).many().confirmRemove(row, opts?)` (confirm → remove → auto error-toast, never re-throws), `editInDialog(row, body, opts?)` and `createInDialog(body, opts?)` (seed draft → `dialog.show` → cancel on close).
- `toast` + `<FF_ToastManager>` - a `LocalizedMessage`-aware wrapper over svelte-sonner (a new direct dependency). First arg is the **description** (HTML allowed); the bold **title** moves to `opts.title` and defaults per kind, localizable via `<FF_Config messages.toast>`. See `/docs/svelte/toast`.
