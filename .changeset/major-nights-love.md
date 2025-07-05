---
'firstly': minor
---

[BREAKING] - deprecate firstly module in favor of remult module

```diff
remultApi({
--	modules: [],   // firstly modules
++	modulesFF: [], // firstly modules
})

Then, you can use `modules` level of `remult`