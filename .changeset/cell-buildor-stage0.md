---
'firstly': minor
---

Add headless `FF_Grid`, `FF_Form`, and `FF_Cell` plus a `buildCells` buildor (metadata-driven cells with a per-cell escape hatch). Style is configured once at the app root via the new `FF_Config` `cell` registry; firstly ships no styled input (a token-only default lives in the `grid` boutique recipe). `DemoGrid`/`DemoForm` are unchanged.
