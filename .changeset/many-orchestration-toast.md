---
'firstly': minor
---

Add `many` action+confirm orchestration and a `toast` (`firstly/svelte`):

- `ff(E).many().confirmRemove(row, opts?)` (confirm → remove → auto error-toast, never re-throws), `editInDialog(row, body, opts?)` and `createInDialog(body, opts?)` (seed draft → `dialog.show` → cancel on close).
- `toast` + `<FF_ToastManager>` - a thin, `LocalizedMessage`-aware wrapper over svelte-sonner (a new direct dependency); defaults via `<FF_Config toast={...}>`. See `/docs/svelte/toast`.
