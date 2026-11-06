---
'firstly': patch
---

sqlAdmin drift: index builders and relation index coverage put `NULLS FIRST` on `allowNull` columns, following remult `NullSort` (defaults to NULLS FIRST until remult has it). `nullsFirst: false` opts out.
