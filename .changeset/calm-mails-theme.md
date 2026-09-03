---
'firstly': patch
---

- BackendMethods of `mail`, `sqlAdmin` and `feedback` now carry an `apiPrefix` (`/api/mail/sendTest`, `/api/sqlAdmin/exec`, ...) so a host app method with the same name (e.g. its own `sendTest`) can no longer shadow them.
- `WriteMail` / `LastMails` read the semantic theme tokens (`bg-card`, `border-border`, `text-primary`, ...) like `SqlAdmin` instead of a hardcoded slate palette.
- `SqlAdmin`: the write toggle is a static "Allow writes" checkbox; the label no longer flips with the state.
