---
'firstly': patch
---

sqlAdmin drift: `relationIndexes` skips relations keyed on a computed field (`sqlExpression` / `serverExpression`), which have no column to index and produced invalid SQL.
