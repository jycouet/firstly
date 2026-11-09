---
'firstly': minor
---

`<Icon>` (Svelte 5) also draws Lucide icon nodes (`data={Skull}` from `lucide`, stroke-drawn, `strokeWidth`), so it can replace `@lucide/svelte`. Server rendering defaults to `'sprite'`: each distinct icon once as a `<symbol>` + a `<use>` per occurrence. Optional `setIconOptions({ ssr, strokeWidth })` sets app defaults (`ssr: false` for the old empty box).

BREAKING: `LibIcon_*` are redrawn in Lucide style and are now `IconNode`s instead of path strings (except `LibIcon_Man`, `LibIcon_Woman`, `LibIcon_Empty`). `@mdi/js` is no longer a dependency. An `<Icon>` without `caption` is `aria-hidden`. Server-rendered icons are drawn (sprite) instead of an empty box.
