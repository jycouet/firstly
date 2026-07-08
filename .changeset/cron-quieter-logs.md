---
"firstly": minor
---

cron: quieter logs by default - a tick only logs `done in Xms` when it took at least `logs.ended` ms (default 100; `true` = always, `false` = never). `starting` and `result` lines are opt-in, `logs.setup` can silence the registration line. If `onTick` throws, the run is now stored as `failed` (error in `result`), always logged, and no longer leaks the concurrency slot.
