---
'firstly': minor
---

sqlAdmin: opt-in `tokens` (bearer tokens to run SQL from a script or an AI through the same `exec` endpoint; `read` = READ ONLY transaction over the extended protocol, acts as the minter, logged) + `<SqlTokens />`; `sqlAdmin: false` registers no controller (throws when combined with `tokens`).
