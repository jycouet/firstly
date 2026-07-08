---
"firstly": minor
---

cron: quieter logs by default - one `done in Xms` line per tick; `starting` and `result` lines are now opt-in via `logs`, and `logs.setup` can silence the registration line. If `onTick` throws, the run is now stored as `failed` (error in `result`), always logged, and no longer leaks the concurrency slot.
