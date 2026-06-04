---
'firstly': patch
---

fix(svelte): portal `FF_DialogManager` panels to `<body>`

Dialog/confirm/prompt panels rendered wherever `<FF_DialogManager>` sat in the
layout - inside the app root that the manager marks `inert` to trap focus. When
the `inert` effect won the race against the panel's autofocus, the whole panel
stopped receiving pointer events (real clicks died; `elementFromPoint` returned
`<body>`; AT saw it as "ignored"), while synthetic `.click()` still worked - so
it looked fine in tests but was dead under a real mouse.

Panels are now portaled to `<body>` (true siblings of the app root, matching the
existing design comment), so inerting the root never touches them. The
now-obsolete `root.contains(activeElement)` race-guard is dropped, so the
background is reliably inerted again.
