---
'firstly': minor
---

`<Icon>` (Svelte 5) also draws Lucide icon nodes (`data={Skull}` from `lucide`, stroke-drawn, `strokeWidth`), so it can replace `@lucide/svelte`. New `setIconOptions({ ssr, strokeWidth })` sets defaults for the app, and `ssr: 'sprite'` renders each distinct icon once as a `<symbol>` + a `<use>` per occurrence.

BREAKING: `LibIcon_*` are redrawn in Lucide style and are now `IconNode`s instead of path strings (except `LibIcon_Man`, `LibIcon_Woman`, `LibIcon_Empty`). `@mdi/js` is no longer a dependency. An `<Icon>` without `caption` is `aria-hidden`.
