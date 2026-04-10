---
'firstly': minor
---

BREAKING: Remove unused legacy components from `firstly/svelte`: `FF_Cell` (+ `FF_Cell_Caption/Display/Edit/Error/Hint`), `FF_Form`, `FF_Grid`, `FF_Layout`, `FF_Config` (+ `ff_Config.svelte.ts` with `daisyTheme`, `defaultTheme`, `emptyTheme`, `getTheme`, `setTheme`, `getDynamicCustomField`, `setDynamicCustomField`, `getClasses`, `FF_Theme`). Also removed `customField.ts` (`DynamicCustomField`, `CellMetadata`, `FieldGroup`, `getLayout`, and the related `FieldOptions.ui` / `EntityOptions.ui.getLayout` Remult module augmentations). Drops the `FF_Repo.getLayout()` instance method and the `internals/select/Select2.svelte` internal.

Also deletes the duplicate dead `svelte/dialog/` tree (the canonical `dialog()` API is exported from `firstly/internals` and backed by `ui/dialog/`).

Internal: removes the `task` demo module and its demo routes (`demo/FF_Cell`, `demo/FF_Form_Grid`, `demo/FF_Layout`, `demo/FF_Simple`).
