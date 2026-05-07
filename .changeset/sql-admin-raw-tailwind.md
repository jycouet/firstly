---
'firstly': patch
---

`firstly/sqlAdmin`: rewrite the `<SqlAdmin />` component using only raw Tailwind utilities. Previously it relied on daisyUI tokens (`btn`, `alert`, `table-zebra`, `bg-base-*`, `loading-spinner`, ...) which left the page unstyled in projects that use Tailwind without daisyUI. The component now ships with neutral zinc styles (red/green/blue for error/success/info states) and an inline SVG spinner, so it works as a drop-in in any Tailwind v4 project regardless of the consumer's component library.
