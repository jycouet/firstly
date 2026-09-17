---
'firstly': minor
---

sqlAdmin: `exec(sql, capabilities = ['read'])` replaces the `notReadOnly` flag - reads run in a READ ONLY transaction over the extended protocol (one statement). Opt-in `tokens` (bearer tokens to run SQL from a script or an AI through the same `exec` endpoint; acts as the minter, logged) + `<SqlTokens />`; `sqlAdmin: false` registers no controller (throws when combined with `tokens`).
