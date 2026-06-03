# Cell Buildor - Stage 0 (firstly headless Grid + Form + Cell) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a headless, metadata-driven Cell/Grid/Form layer to the `firstly` package, on top of the existing `ff` engine, so consumer apps share one logic engine while keeping their own look via an app-level style registry.

**Architecture:** Port prevention's proven `FF_Cell` (`%`-flex + mobile + label/content/error/hint sub-slots) into firstly; add a pure `buildCells(meta, selected)` buildor (metadata SSoT + per-cell escape hatch); add headless `FF_Grid` (read/sort/paginate/delete) and `FF_Form` (one-bound edit) that consume cells; extend the existing `FF_Config` context with a `cell` registry (geometry defaults + per-inputType input components) so the style is configured once at app root. firstly ships **zero** styled component; a token-only default `Input` lives in `src/boutique/` (copy-own). `DemoGrid`/`DemoForm` stay untouched.

**Tech Stack:** Svelte 5 (runes), TypeScript, remult 3.3.x, Vitest (node + playwright/chromium browser projects), changesets, svelte-package.

**Locked decisions (do not relitigate):** extract-into-firstly first · metadata key is `FieldOptions.ui` · headless engine + boutique default skin · `%`-flex + mobile canonical, Tailwind colspan via `Cell.class` passthrough · keep `DemoGrid`/`DemoForm` · `FF_Grid`/`FF_Form` names · Cell = metadata SSoT + escape hatch.

**Working dir for all commands:** `cd /home/jycouet/udev/gh/yved/jycouet_firstly/wt-02/packages/firstly`
Branch is already `cell-buildor-and-co`. New module folder: `src/lib/svelte/grid/`.

---

## File Structure

Created:
- `src/lib/svelte/grid/cellTypes.ts` - `CellUI`, `MetaKind`, `Cell`, `CellInput`, `CellElementConfig`, `CellConfig` types + the `declare module 'remult'` augmentation adding `FieldOptions.ui`.
- `src/lib/svelte/grid/cellConfig.ts` - `defaultConfig`, `getStyle`, `getCellElementConfig` (reads `ffConfig().cell.config`), `getInputType`.
- `src/lib/svelte/grid/metaKind.ts` - `getFieldMetaType` (relation/enum/primitive/slot) port.
- `src/lib/svelte/grid/buildCells.ts` - `buildCells`, `displayCell`.
- `src/lib/svelte/grid/buildCells.spec.ts`, `src/lib/svelte/grid/metaKind.spec.ts`, `src/lib/svelte/grid/cellConfig.spec.ts` - node specs.
- `src/lib/svelte/grid/FF_Cell.svelte` + `FF_Cell_Content.svelte` + `FF_Cell_Label.svelte` + `FF_Cell_Error.svelte` + `FF_Cell_Hint.svelte` - ported from prevention (rename `cellUI`->`ui`).
- `src/lib/svelte/grid/FF_Cell.svelte.spec.ts`, `FF_Form.svelte.spec.ts`, `FF_Grid.svelte.spec.ts` - browser specs.
- `src/lib/svelte/grid/FF_Form.svelte`, `src/lib/svelte/grid/FF_Grid.svelte` - headless components.
- `src/lib/svelte/grid/index.ts` - folder barrel.
- `src/lib/svelte/firstly.css` - `--ff-spacing` source of truth (ported).
- `src/boutique/grid/Input.svelte` + `src/boutique/grid/README.md` - token-only default input recipe (copy-own; never published).
- `.changeset/cell-buildor-stage0.md`.

Modified:
- `src/lib/svelte/FF_Config.svelte.ts` - add `cell?` to `FF_ConfigValue` + `get cell()`.
- `src/lib/svelte/FF_Config.svelte` - thread the `cell` prop.
- `src/lib/svelte/index.ts` - re-export the new public surface.
- `src/routes/ff-repo/+page.svelte` - mount `FF_Grid`/`FF_Form` demos (dev app only).
- `src/modules/demo/Task.ts` - add `done` (boolean) + `priority` (number) fields for a richer demo (dev app only).

**Pre-flight (run once):**
```bash
cd /home/jycouet/udev/gh/yved/jycouet_firstly/wt-02/packages/firstly
npx playwright install chromium   # browser vitest project needs it on this WSL box
npm run test:unit:ci -- --run src/lib/svelte/ff.svelte.spec.ts   # sanity: existing suite green
```
Expected: existing ff spec passes (proves harness works before we add to it).

---

### Task 1: Cell types + `FieldOptions.ui` metadata augmentation

**Files:**
- Create: `src/lib/svelte/grid/cellTypes.ts`

- [ ] **Step 1: Write the types file**

```ts
import type { Component, Snippet } from 'svelte'
import type { ClassType, FieldMetadata } from 'remult'

/** Per-field UI hints. width/margins are PERCENTAGES of the parent row. */
export interface CellUI {
	/** Override the resolved input type ('text'|'number'|'date'|'checkbox'|'select'|'multiSelect'|...). */
	inputType?: string
	width?: number
	marginLeft?: number
	marginRight?: number
	/** Independent geometry for screens <= 40rem. */
	mobile?: { width?: number; marginLeft?: number; marginRight?: number }
	/** Column alignment in a grid. */
	align?: 'left' | 'center' | 'right'
	order?: number
}

/** How a resolved cell renders. */
export type MetaKind =
	| 'field' // remult displayValue of a primitive/enum field
	| 'field_link' // a field whose `options.href` makes it a link
	| 'relation' // a relation field (display via the related row)
	| 'enum' // single value-list
	| 'enum_multi' // array value-list
	| 'slot' // app owns the render (via cellSnippet)
	| 'component' // render an explicit component
	| 'header' // a static label cell (no field)
	| 'spacer' // empty layout cell

/** Resolved, headless cell descriptor consumed by FF_Grid / FF_Form. */
export interface Cell<E = any> {
	col?: keyof E & string
	field?: FieldMetadata<unknown, E>
	kind: MetaKind
	caption: string
	ui: CellUI
	/** Resolved input type for edit (getInputType). */
	inputType: string
	align: 'left' | 'center' | 'right'
	/** Tailwind/CSS passthrough (e.g. 'col-span-2'). */
	class?: string
	// ----- escape hatches (metadata SSoT, escape when needed) -----
	cellSnippet?: Snippet<[{ row: E; cell: Cell<E> }]>
	component?: Component
	rowToProps?: (row: E) => Record<string, unknown>
}

/** Terse author input: a bare field key, or a config object, or '_spacer'. */
export type CellInput<E> =
	| (keyof E & string)
	| {
			col: (keyof E & string) | '_spacer'
			kind?: MetaKind
			caption?: string
			ui?: CellUI
			align?: 'left' | 'center' | 'right'
			class?: string
			cellSnippet?: Snippet<[{ row: E; cell: Cell<E> }]>
			component?: Component
			rowToProps?: (row: E) => Record<string, unknown>
	  }

/** Geometry config for one of a cell's four sub-elements. */
export interface CellElementConfig {
	width?: number
	order?: number
	align?:
		| 'TopLeft'
		| 'TopCenter'
		| 'TopRight'
		| 'MiddleLeft'
		| 'MiddleCenter'
		| 'MiddleRight'
		| 'BottomLeft'
		| 'BottomCenter'
		| 'BottomRight'
	class?: string
	style?: string
}

/** App-level default geometry for the label/error/content/hint sub-elements. */
export interface CellConfig {
	label?: CellElementConfig
	error?: CellElementConfig
	content?: CellElementConfig
	hint?: CellElementConfig
}

// ---- remult metadata augmentation: per-field UI hints live ON the field (SSoT) ----
declare module 'remult' {
	interface FieldOptions<entityType, valueType> {
		/** firstly cell UI hints (width %, inputType, mobile, align). */
		ui?: CellUI
		/** Input placeholder. */
		placeholder?: string
		/** For multiSelect value-lists: the element value-list class. */
		valueTypeArray?: ClassType<valueType>
	}
}
```

- [ ] **Step 2: Type-check it compiles and the augmentation resolves**

Run: `npx svelte-check --tsconfig ./tsconfig.json --threshold error 2>&1 | tail -20`
Expected: no errors referencing `grid/cellTypes.ts`. (A field can now be declared `@Fields.string({ ui: { width: 50 } })` without a TS error - verified indirectly by Task 4/5 specs.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/svelte/grid/cellTypes.ts
git commit -m "feat(grid): cell types + FieldOptions.ui metadata augmentation"
```

---

### Task 2: `cellConfig.ts` - geometry defaults, getStyle, getCellElementConfig, getInputType

**Files:**
- Create: `src/lib/svelte/grid/cellConfig.ts`
- Create: `src/lib/svelte/grid/cellConfig.spec.ts`

- [ ] **Step 1: Write the failing test** (`cellConfig.spec.ts`) - `getStyle` is a pure string builder:

```ts
import { describe, expect, it } from 'vitest'

import { getStyle } from './cellConfig.js'

describe('getStyle', () => {
	it('emits width/flex/order and maps MiddleRight to flex-end + center', () => {
		const s = getStyle({ width: 50, order: 2, align: 'MiddleRight' })
		expect(s).toContain('width: 50%')
		expect(s).toContain('flex: 0 0 50%')
		expect(s).toContain('order: 2')
		expect(s).toContain('justify-content: flex-end')
		expect(s).toContain('align-items: center')
	})

	it('omits justify/align when align is undefined', () => {
		const s = getStyle({ width: 100, order: 1 })
		expect(s).not.toContain('justify-content')
		expect(s).not.toContain('align-items')
	})
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/svelte/grid/cellConfig.spec.ts`
Expected: FAIL - `Cannot find module './cellConfig.js'`.

- [ ] **Step 3: Write `cellConfig.ts`**

```ts
import type { FieldOptions } from 'remult'

import { ffConfig } from '../FF_Config.svelte.js'
import type { CellConfig, CellElementConfig, CellUI } from './cellTypes.js'

/** firstly's built-in geometry: label/error share a row, content + hint full width. */
export const defaultConfig: CellConfig = {
	label: { width: 50, order: 1, align: 'MiddleLeft' },
	error: { width: 50, order: 2, align: 'MiddleRight' },
	content: { width: 100, order: 3, align: 'MiddleLeft' },
	hint: { width: 100, order: 4, align: 'MiddleLeft' },
}

/** Build an inline style string for one sub-element from its CellElementConfig. */
export function getStyle(config: CellElementConfig): string {
	const justify = config.align?.includes('Left')
		? 'flex-start'
		: config.align?.includes('Right')
			? 'flex-end'
			: config.align?.includes('Center')
				? 'center'
				: undefined
	const items = config.align?.includes('Top')
		? 'start'
		: config.align?.includes('Bottom')
			? 'end'
			: config.align?.includes('Center')
				? 'center'
				: undefined
	return [
		`width: ${config.width}%`,
		`flex: 0 0 ${config.width}%`,
		`order: ${config.order}`,
		`display: flex`,
		justify ? `justify-content: ${justify}` : '',
		items ? `align-items: ${items}` : '',
		config.style ?? '',
	]
		.filter(Boolean)
		.join('; ')
}

/**
 * Resolve a sub-element's geometry: firstly default <- app-level FF_Config `cell.config`.
 * MUST be called during component init (it reads context via `ffConfig()`).
 */
export function getCellElementConfig(element: keyof CellConfig): CellElementConfig {
	const appConfig = ffConfig().cell?.config ?? {}
	return { ...defaultConfig[element], ...appConfig[element] }
}

/** Resolved input type: field `ui.inputType` > remult `inputType` > 'text'. */
export function getInputType(fo: FieldOptions<unknown, unknown>): string {
	return (fo as { ui?: CellUI }).ui?.inputType ?? fo.inputType ?? 'text'
}
```

Note: `ffConfig().cell` is added in Task 3; this file imports it now (type-only friendly). If Task 3 is not yet done, `ffConfig()` has no `cell` getter and `.cell?.config` is `undefined` - the `?.` keeps it safe at runtime, but `svelte-check` will error until Task 3 lands. **Do Task 3 immediately after to clear the type error.**

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/svelte/grid/cellConfig.spec.ts`
Expected: PASS (2 tests). The `getStyle` tests do not touch context, so they pass regardless of Task 3.

- [ ] **Step 5: Commit**

```bash
git add src/lib/svelte/grid/cellConfig.ts src/lib/svelte/grid/cellConfig.spec.ts
git commit -m "feat(grid): cell geometry config (getStyle/getCellElementConfig/getInputType)"
```

---

### Task 3: Extend `FF_Config` with a `cell` registry

**Files:**
- Modify: `src/lib/svelte/FF_Config.svelte.ts`
- Modify: `src/lib/svelte/FF_Config.svelte`

- [ ] **Step 1: Add the `cell` branch to `FF_ConfigValue`** (`FF_Config.svelte.ts`). Add the import at the top of the file (after the existing imports):

```ts
import type { Component, Snippet } from 'svelte'
import type { CellConfig, MetaKind } from './grid/cellTypes.js'
```
(The file already imports `Snippet`; keep one import line - merge `Component` into the existing `import type { Snippet } from 'svelte'` so it reads `import type { Component, Snippet } from 'svelte'`.)

Then add a fourth optional key to the `FF_ConfigValue` type (after `toast?: Partial<ToasterProps>`):

```ts
	/**
	 * Cell/Grid/Form skin, applied once at the app root. firstly ships no styled input -
	 * register your own per-inputType components here so the app keeps its look.
	 */
	cell?: {
		/** App-level geometry defaults for the label/error/content/hint sub-elements. */
		config?: CellConfig
		/** Per-inputType edit component (receives `bind:value` + { id, type, placeholder, valueConverter }). */
		inputs?: Partial<Record<string, Component>>
		/** Optional per-kind display override for grid/readonly cells. */
		display?: Partial<Record<MetaKind, Snippet<[{ row: unknown; value: unknown }]>>>
	}
```

- [ ] **Step 2: Add the `get cell()` getter** in `ffConfig()` (after `get toast()`):

```ts
		get cell() {
			return get?.().cell ?? {}
		},
```

- [ ] **Step 3: Thread the prop through the provider** (`FF_Config.svelte`). Change line 6 + line 10:

```svelte
	let { children, messages, dialog, toast, cell }: { children: Snippet } & FF_ConfigValue = $props()
	setFFConfig(() => ({ messages, dialog, toast, cell }))
```

- [ ] **Step 4: Verify types compile (this also clears Task 2's pending error)**

Run: `npx svelte-check --tsconfig ./tsconfig.json --threshold error 2>&1 | tail -20`
Expected: no errors in `FF_Config.svelte.ts`, `FF_Config.svelte`, or `grid/cellConfig.ts`.

- [ ] **Step 5: Verify the existing config/dialog/toast tests still pass**

Run: `npx vitest run src/lib/svelte/dialog.svelte.spec.ts 2>&1 | tail -15` (if present; otherwise run the whole node project: `npm run test:unit:ci -- --project node 2>&1 | tail -20`)
Expected: PASS - no regressions from the added optional key.

- [ ] **Step 6: Commit**

```bash
git add src/lib/svelte/FF_Config.svelte.ts src/lib/svelte/FF_Config.svelte
git commit -m "feat(config): add cell registry (config/inputs/display) to FF_Config"
```

---

### Task 4: `metaKind.ts` - derive cell kind from field metadata

**Files:**
- Create: `src/lib/svelte/grid/metaKind.ts`
- Create: `src/lib/svelte/grid/metaKind.spec.ts`

- [ ] **Step 1: Write the failing test** (`metaKind.spec.ts`):

```ts
import { describe, expect, it } from 'vitest'
import { Entity, Fields, Relations, repo, ValueListFieldType } from 'remult'

import { BaseEnum } from '../../core/BaseEnum.js'
import { getFieldMetaType } from './metaKind.js'

@ValueListFieldType()
class Color extends BaseEnum {
	static red = new Color('red', { caption: 'Red' })
	static blue = new Color('blue', { caption: 'Blue' })
}

@Entity('mk_parent')
class Parent {
	@Fields.id() id = ''
	@Fields.string() name = ''
}

@Entity('mk_child')
class Child {
	@Fields.id() id = ''
	@Fields.string() title = ''
	@Fields.number() qty = 0
	@Fields.string({ ui: { inputType: 'select' } }) status = ''
	@Fields.object<Child, Color>(() => Color) color = Color.red
	@Relations.toOne(() => Parent) parent?: Parent
}

describe('getFieldMetaType', () => {
	const m = repo(Child).metadata
	it('primitive: a plain string field', () => {
		expect(getFieldMetaType(m.fields.find('title')).kind).toBe('primitive')
		expect(getFieldMetaType(m.fields.find('title')).subKind).toBe('text')
	})
	it('primitive: number keeps inputType subKind', () => {
		expect(getFieldMetaType(m.fields.find('qty')).subKind).toBe('number')
	})
	it('enum: a value-list field is single enum', () => {
		expect(getFieldMetaType(m.fields.find('color')).kind).toBe('enum')
	})
	it('relation: a toOne relation', () => {
		expect(getFieldMetaType(m.fields.find('parent')).kind).toBe('relation')
	})
	it('slot: undefined field', () => {
		expect(getFieldMetaType(undefined).kind).toBe('slot')
	})
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/svelte/grid/metaKind.spec.ts`
Expected: FAIL - `Cannot find module './metaKind.js'`.

- [ ] **Step 3: Write `metaKind.ts`** (port of my-minion `getFieldMetaType`):

```ts
import type { FieldMetadata, Repository } from 'remult'
import { getRelationFieldInfo } from 'remult/internals'

import type { BaseEnum } from '../../core/BaseEnum.js'

export type FieldMetaType =
	| { kind: 'relation'; subKind: 'reference' | 'toOne' | 'toMany'; repoTarget: Repository<unknown>; field: FieldMetadata }
	| { kind: 'enum'; subKind: 'single' | 'multi'; values: BaseEnum[]; field: FieldMetadata }
	| { kind: 'primitive'; subKind: string; field: FieldMetadata }
	| { kind: 'slot'; subKind: '???' }

/**
 * Derive a render "kind" from a remult FieldMetadata.
 * Mirrors my-minion's old_ff getFieldMetaType (the renderer brain), minus the daisyUI bits.
 * Note: value-lists are read off `options.valueConverter.values` directly - `getValueList(field)`
 * throws "ValueType not yet initialized" here, so don't use it.
 */
export function getFieldMetaType(field?: FieldMetadata, withHidden = false): FieldMetaType {
	if (field === undefined) return { kind: 'slot', subKind: '???' }

	const rel = getRelationFieldInfo(field)
	if (rel) {
		return { kind: 'relation', subKind: rel.type, repoTarget: rel.toRepo as Repository<unknown>, field }
	}

	const opts = field.options as { inputType?: string; valueConverter?: { values?: BaseEnum[] } }
	if (opts?.inputType === 'selectArrayEnum') {
		return { kind: 'enum', subKind: 'multi', values: opts.valueConverter?.values ?? [], field }
	}
	if (opts?.valueConverter?.values) {
		const values = opts.valueConverter.values
		return {
			kind: 'enum',
			subKind: 'single',
			values: withHidden ? values : values.filter((v) => !(v as BaseEnum & { hide?: boolean }).hide),
			field,
		}
	}
	return { kind: 'primitive', subKind: field.inputType ?? 'text', field }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/svelte/grid/metaKind.spec.ts`
Expected: PASS (5 tests). If the relation test fails with a `getRelationFieldInfo` import error, confirm the path is `remult/internals` (it is exported there; my-minion uses the same import).

- [ ] **Step 5: Commit**

```bash
git add src/lib/svelte/grid/metaKind.ts src/lib/svelte/grid/metaKind.spec.ts
git commit -m "feat(grid): getFieldMetaType - relation/enum/primitive kind derivation"
```

---

### Task 5: `buildCells.ts` - the buildor + `displayCell`

**Files:**
- Create: `src/lib/svelte/grid/buildCells.ts`
- Create: `src/lib/svelte/grid/buildCells.spec.ts`

- [ ] **Step 1: Write the failing test** (`buildCells.spec.ts`):

```ts
import { describe, expect, it } from 'vitest'
import { Entity, Fields, repo } from 'remult'

import { buildCells, displayCell } from './buildCells.js'

@Entity('bc_item')
class Item {
	@Fields.id() id = ''
	@Fields.string({ caption: 'Title' }) title = ''
	@Fields.number({ ui: { width: 50, align: 'right' } }) amount = 0
	@Fields.string({ href: (row: Item) => `/x/${row.id}` }) ref = ''
	@Fields.createdAt() createdAt = new Date()
}

describe('buildCells', () => {
	const meta = repo(Item).metadata

	it('auto: builds a cell per field, caption from metadata', () => {
		const cells = buildCells(meta)
		const byCol = Object.fromEntries(cells.map((c) => [c.col, c]))
		expect(byCol['title'].caption).toBe('Title')
		expect(byCol['title'].kind).toBe('field')
	})

	it('selected: terse keys + config object, in order', () => {
		const cells = buildCells(meta, ['title', { col: 'amount', class: 'col-span-2' }])
		expect(cells.map((c) => c.col)).toEqual(['title', 'amount'])
		expect(cells[1].class).toBe('col-span-2')
	})

	it('reads % width + align from field ui option (SSoT)', () => {
		const c = buildCells(meta, ['amount'])[0]
		expect(c.ui.width).toBe(50)
		expect(c.align).toBe('right')
	})

	it('href field defaults to field_link kind', () => {
		expect(buildCells(meta, ['ref'])[0].kind).toBe('field_link')
	})

	it('per-cell ui override beats the field option', () => {
		const c = buildCells(meta, [{ col: 'amount', ui: { width: 25 } }])[0]
		expect(c.ui.width).toBe(25)
	})

	it('_spacer makes an empty spacer cell', () => {
		const c = buildCells(meta, [{ col: '_spacer' }])[0]
		expect(c.kind).toBe('spacer')
		expect(c.col).toBeUndefined()
	})

	it('explicit kind wins (slot escape hatch)', () => {
		expect(buildCells(meta, [{ col: 'title', kind: 'slot' }])[0].kind).toBe('slot')
	})
})

describe('displayCell', () => {
	const meta = repo(Item).metadata
	it('uses remult displayValue for a primitive', () => {
		const c = buildCells(meta, ['title'])[0]
		expect(displayCell(c, { title: 'Hello' } as Item)).toBe('Hello')
	})
	it('returns empty string when no field/value', () => {
		const c = buildCells(meta, [{ col: '_spacer' }])[0]
		expect(displayCell(c, {} as Item)).toBe('')
	})
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/svelte/grid/buildCells.spec.ts`
Expected: FAIL - `Cannot find module './buildCells.js'`.

- [ ] **Step 3: Write `buildCells.ts`**

```ts
import type { EntityMetadata, FieldMetadata } from 'remult'

import { getInputType } from './cellConfig.js'
import { getFieldMetaType } from './metaKind.js'
import type { Cell, CellInput, CellUI, MetaKind } from './cellTypes.js'

const HIDE_BY_DEFAULT = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt'])

/** Default column set when `selected` is omitted: visible fields minus id/timestamps. */
function defaultSelected<E>(meta: EntityMetadata<E>): (keyof E & string)[] {
	return meta.fields
		.toArray()
		.filter((f) => !HIDE_BY_DEFAULT.has(f.key) && !f.dbReadOnly && !f.isServerExpression)
		.map((f) => f.key as keyof E & string)
}

function alignFor(field: FieldMetadata | undefined, ui: CellUI): 'left' | 'center' | 'right' {
	if (ui.align) return ui.align
	const it = field?.inputType
	if (it === 'number') return 'right'
	return 'left'
}

/** Resolve the render kind: explicit > href(field_link) > metaKind(relation/enum) > field. */
function resolveKind(field: FieldMetadata | undefined, explicit?: MetaKind): MetaKind {
	if (explicit) return explicit
	if (!field) return 'spacer'
	if ((field.options as { href?: unknown }).href) return 'field_link'
	const mk = getFieldMetaType(field)
	if (mk.kind === 'relation') return 'relation'
	if (mk.kind === 'enum') return mk.subKind === 'multi' ? 'enum_multi' : 'enum'
	return 'field'
}

/**
 * Build headless cell descriptors from entity metadata.
 * `selected` is a terse list of field keys and/or config objects; omit it to auto-build
 * from visible fields. Per-cell config overrides the field's `ui` option (escape the SSoT).
 */
export function buildCells<E>(meta: EntityMetadata<E>, selected?: CellInput<E>[]): Cell<E>[] {
	const input: CellInput<E>[] = selected ?? defaultSelected(meta)
	return input.map((item) => {
		const isObj = typeof item === 'object'
		const colRaw = isObj ? item.col : item
		const spacer = colRaw === '_spacer'
		const field = !spacer ? (meta.fields.find(colRaw as string) as FieldMetadata<unknown, E>) : undefined
		const fieldUI = (field?.options as { ui?: CellUI } | undefined)?.ui ?? {}
		const ui: CellUI = { ...fieldUI, ...(isObj ? item.ui : undefined) }
		const kind = spacer ? 'spacer' : resolveKind(field, isObj ? item.kind : undefined)
		return {
			col: spacer ? undefined : (colRaw as keyof E & string),
			field,
			kind,
			caption: (isObj && item.caption) || field?.caption || '',
			ui,
			inputType: field ? getInputType(field.options) : 'text',
			align: alignFor(field, ui),
			class: isObj ? item.class : undefined,
			cellSnippet: isObj ? item.cellSnippet : undefined,
			component: isObj ? item.component : undefined,
			rowToProps: isObj ? item.rowToProps : undefined,
		}
	})
}

/**
 * Formatted display string for a cell + row. Uses remult `field.displayValue` (which already
 * formats enums/dates/value-lists). Relations/multi-enum that need richer rendering should use
 * a `cellSnippet` escape hatch (Stage 0 does not auto-resolve the related row's caption).
 */
export function displayCell<E>(cell: Cell<E>, row: E): string {
	if (!cell.field) return ''
	const v = cell.field.displayValue(row as Partial<E>)
	return v ?? ''
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/svelte/grid/buildCells.spec.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/svelte/grid/buildCells.ts src/lib/svelte/grid/buildCells.spec.ts
git commit -m "feat(grid): buildCells buildor + displayCell (metadata SSoT + escape)"
```

---

### Task 6: `FF_Cell` family + `firstly.css` (port from prevention, rename `cellUI`->`ui`)

**Files:**
- Create: `src/lib/svelte/firstly.css`
- Create: `src/lib/svelte/grid/FF_Cell.svelte`
- Create: `src/lib/svelte/grid/FF_Cell_Content.svelte`
- Create: `src/lib/svelte/grid/FF_Cell_Label.svelte`
- Create: `src/lib/svelte/grid/FF_Cell_Error.svelte`
- Create: `src/lib/svelte/grid/FF_Cell_Hint.svelte`
- Create: `src/lib/svelte/grid/FF_Cell.svelte.spec.ts`

- [ ] **Step 1: Write `firstly.css`** (the `--ff-spacing` source; gives a fallback so cells aren't padding-0 if unimported):

```css
* {
	--ff-spacing: 0.5rem;
}
@media screen and (max-width: 40rem) {
	* {
		--ff-spacing: 0.15rem;
	}
}
```

- [ ] **Step 2: Write the four sub-components.**

`FF_Cell_Label.svelte`:
```svelte
<script lang="ts">
	import { getCellElementConfig, getStyle } from './cellConfig.js'
	import type { CellElementProps } from './cellTypes.js'

	interface Props {
		id: string
		elementProps?: CellElementProps
	}
	let { id, elementProps }: Props = $props()
	const config = { ...getCellElementConfig('label'), ...elementProps?.config }
</script>

{#if elementProps}
	<label id={id + '-label'} data-ff-cell-label for={id} class={config.class} style={getStyle(config)}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted, app-authored caption -->
		{@html elementProps?.html}
	</label>
{/if}

<style>
	[data-ff-cell-label] {
		display: block;
		max-width: 100%;
		min-width: 0;
		overflow-wrap: anywhere;
	}
</style>
```

`FF_Cell_Error.svelte` (identical to Label except tag/id/style block):
```svelte
<script lang="ts">
	import { getCellElementConfig, getStyle } from './cellConfig.js'
	import type { CellElementProps } from './cellTypes.js'

	interface Props {
		id: string
		elementProps?: CellElementProps
	}
	let { id, elementProps }: Props = $props()
	const config = { ...getCellElementConfig('error'), ...elementProps?.config }
</script>

{#if elementProps}
	<div id={id + '-error'} data-ff-cell-error class={config.class} style={getStyle(config)}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted, app-authored error html -->
		{@html elementProps?.html}
	</div>
{/if}

<style>
	[data-ff-cell-error] {
		color: var(--color-error, red);
		font-size: smaller;
	}
</style>
```

`FF_Cell_Hint.svelte` (same shape; note the fallback added to `--muted-foreground` since firstly does not define it):
```svelte
<script lang="ts">
	import { getCellElementConfig, getStyle } from './cellConfig.js'
	import type { CellElementProps } from './cellTypes.js'

	interface Props {
		id: string
		elementProps?: CellElementProps
	}
	let { id, elementProps }: Props = $props()
	const config = { ...getCellElementConfig('hint'), ...elementProps?.config }
</script>

{#if elementProps}
	<div id={id + '-hint'} data-ff-cell-hint class={config.class} style={getStyle(config)}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted, app-authored hint html -->
		{@html elementProps?.html}
	</div>
{/if}

<style>
	[data-ff-cell-hint] {
		color: var(--muted-foreground, color-mix(in srgb, currentColor 60%, transparent));
		font-size: smaller;
	}
</style>
```

`FF_Cell_Content.svelte` (the IO seam - renders a registered component bound to `value`):
```svelte
<script lang="ts">
	import { getCellElementConfig, getStyle } from './cellConfig.js'
	import type { CellContentProps, CellMode } from './cellTypes.js'

	interface Props {
		id: string
		contentProps?: CellContentProps
		value?: unknown
		mode: CellMode
	}
	let { id, contentProps, value = $bindable(), mode }: Props = $props()
	const contentConfig = { ...getCellElementConfig('content'), ...contentProps?.config }
	const Component = $derived(
		mode === 'edit'
			? contentProps?.component
			: (contentProps?.componentReadonly ?? contentProps?.component),
	)
</script>

{#if Component}
	<div id={id + '-content'} data-ff-cell-content class={contentConfig.class} style={getStyle(contentConfig)}>
		<Component {id} {...contentProps?.props} bind:value>
			{#if typeof contentProps?.children === 'string'}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted, app-authored content -->
				{@html contentProps?.children}
			{:else}
				{contentProps?.children}
			{/if}
		</Component>
	</div>
{/if}
```

Add `CellContentProps`, `CellElementProps`, `CellMode` to `cellTypes.ts` (append - they were used above):
```ts
import type { Component } from 'svelte'
// ... (already imported above)

export interface CellContentProps {
	component?: Component
	componentReadonly?: Component
	props?: Record<string, unknown>
	children?: string | Component
	config?: CellElementConfig
}
export interface CellElementProps {
	html?: string
	config?: CellElementConfig
}
export type CellMode = 'edit' | 'readonly'

export type CellProps<E = unknown> = {
	key?: string
	mode?: CellMode
	label?: CellElementProps
	error?: CellElementProps
	hint?: CellElementProps
	content?: CellContentProps
	value?: unknown
	ui?: CellUI
}
```

- [ ] **Step 3: Write `FF_Cell.svelte`** (the orchestrator; renamed `cellUI`->`ui`):

```svelte
<script lang="ts">
	import { getCellElementConfig, getStyle } from './cellConfig.js'
	import type { CellProps } from './cellTypes.js'
	import FF_Cell_Content from './FF_Cell_Content.svelte'
	import FF_Cell_Error from './FF_Cell_Error.svelte'
	import FF_Cell_Hint from './FF_Cell_Hint.svelte'
	import FF_Cell_Label from './FF_Cell_Label.svelte'

	type Props = { debug?: boolean; children?: import('svelte').Snippet; value?: unknown } & CellProps

	let { children, value = $bindable(), ...props }: Props = $props()

	const default_uid = $props.id()
	let id = $derived(props.key ?? default_uid)
	let ui = $derived(props.ui)
	let mode = $derived(props.mode ?? 'edit')
	let debug = $derived(props.debug === true ? true : undefined)

	const contentConfig = { ...getCellElementConfig('content'), ...props.content?.config }

	let hasError = $derived(!!props.error?.html)
	let labelProps = $derived(
		props.label
			? {
					...props.label,
					config: {
						...getCellElementConfig('label'),
						...props.label.config,
						...(!hasError ? { width: 100 } : {}),
					},
				}
			: undefined,
	)
</script>

<div
	data-ff-cell
	style:--width={ui?.width ?? 100}
	style:--margin-left={ui?.marginLeft ?? 0}
	style:--margin-right={ui?.marginRight ?? 0}
	style:--width-mobile={ui?.mobile?.width ?? 100}
	style:--margin-left-mobile={ui?.mobile?.marginLeft ?? 0}
	style:--margin-right-mobile={ui?.mobile?.marginRight ?? 0}
	data-ff-cell-debug={debug}
>
	<FF_Cell_Label {id} elementProps={labelProps} />
	<FF_Cell_Error {id} elementProps={props.error} />
	{#if children}
		<div data-ff-cells style={getStyle(contentConfig)}>{@render children?.()}</div>
	{:else}
		<FF_Cell_Content {id} {mode} contentProps={props.content} bind:value />
	{/if}
	<FF_Cell_Hint {id} elementProps={props.hint} />
</div>

<style>
	[data-ff-cells] {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
	}
	[data-ff-cell] {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-content: flex-start;
		box-sizing: border-box;
		padding: var(--ff-spacing, 0.5rem);
		flex: 1 1 calc(var(--width, 100) * 1%);
		max-width: calc(var(--width, 100) * 1%);
		min-width: 0;
		margin-left: calc(var(--margin-left, 0) * 1%);
		margin-right: calc(var(--margin-right, 0) * 1%);
	}
	:global([data-ff-cell] > *) {
		flex: 0 0 100%;
		width: 100%;
	}
	[data-ff-cell][data-ff-cell-debug] {
		outline: 1px solid var(--destructive, red);
		outline-offset: -1px;
	}
	@media screen and (max-width: 40rem) {
		[data-ff-cell] {
			flex: 1 1 calc(var(--width-mobile, 100) * 1%);
			max-width: calc(var(--width-mobile, 100) * 1%);
			margin-left: calc(var(--margin-left-mobile, 0) * 1%);
			margin-right: calc(var(--margin-right-mobile, 0) * 1%);
		}
	}
</style>
```

- [ ] **Step 4: Write the failing browser test** (`FF_Cell.svelte.spec.ts` - `.svelte.spec.ts` => chromium project):

```ts
import { flushSync, mount, unmount } from 'svelte'
import { afterEach, describe, expect, it } from 'vitest'

import FF_Cell from './FF_Cell.svelte'

let target: HTMLElement
afterEach(() => target?.remove())

function render(props: Record<string, unknown>) {
	target = document.createElement('div')
	document.body.appendChild(target)
	const comp = mount(FF_Cell, { target, props })
	flushSync()
	return { comp, el: target.querySelector('[data-ff-cell]') as HTMLElement }
}

describe('FF_Cell', () => {
	it('applies the % width css var from ui', () => {
		const { comp, el } = render({ ui: { width: 50 } })
		expect(el.style.getPropertyValue('--width')).toBe('50')
		unmount(comp)
	})

	it('renders the label html', () => {
		const { comp, el } = render({ label: { html: 'Name' } })
		expect(el.querySelector('[data-ff-cell-label]')?.textContent).toContain('Name')
		unmount(comp)
	})

	it('renders an error and keeps it visible', () => {
		const { comp, el } = render({ error: { html: 'required' } })
		expect(el.querySelector('[data-ff-cell-error]')?.textContent).toContain('required')
		unmount(comp)
	})
})
```

- [ ] **Step 5: Run the test to verify it fails then passes**

Run: `npx vitest run --project svelte src/lib/svelte/grid/FF_Cell.svelte.spec.ts`
Expected: first run before Step 2/3 components exist = FAIL (module missing); after writing them = PASS (3 tests). If chromium errors, run `npx playwright install chromium` first.

- [ ] **Step 6: Format-safety check (generics/prettier)**

Run: `npm run format && npx svelte-check --tsconfig ./tsconfig.json --threshold error 2>&1 | tail -20`
Expected: no new errors; `FF_Cell.svelte` has no `generics=` attr so prettier won't strip anything here.

- [ ] **Step 7: Commit**

```bash
git add src/lib/svelte/firstly.css src/lib/svelte/grid/FF_Cell*.svelte src/lib/svelte/grid/cellTypes.ts src/lib/svelte/grid/FF_Cell.svelte.spec.ts
git commit -m "feat(grid): port FF_Cell family (% + mobile + label/content/error/hint) from prevention"
```

---

### Task 7: `FF_Form.svelte` - headless one-bound form

**Files:**
- Create: `src/lib/svelte/grid/FF_Form.svelte`
- Create: `src/lib/svelte/grid/FF_Form.svelte.spec.ts`

- [ ] **Step 1: Write `FF_Form.svelte`.** It builds an `ff().one` internally, derives cells via `buildCells`, renders one `FF_Cell` per field, binds the **raw** draft value (no string coercion), and resolves the input component from `ffConfig().cell.inputs[inputType]`.

```svelte
<script lang="ts" generics="T extends { id: string }">
	import type { ClassType, EntityFilter } from 'remult'

	import { ffConfig } from '../FF_Config.svelte.js'
	import { ff } from '../ff.svelte.js'
	import { buildCells } from './buildCells.js'
	import type { CellInput } from './cellTypes.js'
	import FF_Cell from './FF_Cell.svelte'

	type Props = {
		entity: ClassType<T>
		/** Field descriptors (terse key or config). Defaults to visible fields. */
		selected?: CellInput<T>[]
		where?: EntityFilter<T>
		onsaved?: (saved: T) => void
	}
	let { entity, selected, where, onsaved }: Props = $props()

	const r = ff(entity).one(() => ({ where }))
	const cells = $derived(buildCells(r.meta, selected))

	// keep all `draft as Record` casts in <script> so prettier-svelte can't strip generics in markup
	const get = (key: string): unknown => (r.item as Record<string, unknown> | undefined)?.[key]
	const set = (key: string, v: unknown) => {
		if (r.item) (r.item as Record<string, unknown>)[key] = v
	}

	let errors = $state<Record<string, string | undefined>>({})
	let formError = $state('')

	const inputFor = (inputType: string) => ffConfig().cell.inputs?.[inputType]

	async function submit(e: SubmitEvent) {
		e.preventDefault()
		try {
			const saved = await r.save()
			errors = {}
			formError = ''
			onsaved?.(saved)
		} catch (err) {
			const ms = (err as { modelState?: Record<string, string> })?.modelState
			errors = ms ?? {}
			formError = err instanceof Error ? err.message : String(err)
		}
	}
</script>

{#if r.loading.init}
	<p data-ff-form-loading>…</p>
{:else if r.item}
	<form data-ff-form onsubmit={submit}>
		<FF_Cell>
			{#each cells as cell (cell.col ?? cell.kind)}
				{#if cell.col}
					<FF_Cell
						key={cell.col}
						ui={cell.ui}
						label={{ html: cell.caption }}
						error={{ html: errors[cell.col] }}
						content={{
							component: inputFor(cell.inputType),
							props: {
								type: cell.inputType,
								placeholder: cell.field?.options.placeholder,
								valueConverter: cell.field?.valueConverter,
							},
						}}
						bind:value={() => get(cell.col), (v) => set(cell.col, v)}
					></FF_Cell>
				{:else}
					<FF_Cell ui={cell.ui}></FF_Cell>
				{/if}
			{/each}
		</FF_Cell>
		{#if formError}<p data-ff-form-error>{formError}</p>{/if}
		<button type="submit" data-ff-form-save disabled={r.isWriting || !r.meta.apiUpdateAllowed(r.item)}>
			Save
		</button>
	</form>
{:else}
	<button data-ff-form-new disabled={!r.meta.apiInsertAllowed()} onclick={() => r.create()}>+ New</button>
{/if}
```

Note on the `bind:value={() => get(cell.col), (v) => set(cell.col, v)}` line: `cell.col` is `string | undefined` but it's inside `{#if cell.col}`, so it is a string there. If `svelte-check` complains about `string | undefined`, cast in script via a local `const col = cell.col!` inside an `{@const col = cell.col}` - keep the cast out of the bind expression.

- [ ] **Step 2: Write the failing browser test** (`FF_Form.svelte.spec.ts`):

```ts
import { flushSync, mount, unmount } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Entity, Fields, InMemoryDataProvider, remult, repo } from 'remult'

import { ff } from '../ff.svelte.js'
import FF_Form from './FF_Form.svelte'
import TestInput from './_test/TestInput.svelte'
import Provide from './_test/Provide.svelte'

@Entity('form_row', { allowApiCrud: true })
class Row {
	@Fields.id() id = ''
	@Fields.string({ required: true }) name = ''
}

let target: HTMLElement
beforeEach(() => {
	remult.dataProvider = new InMemoryDataProvider()
})
afterEach(() => target?.remove())

describe('FF_Form', () => {
	it('renders a cell per field and saves the bound value', async () => {
		await repo(Row).insert({ name: 'init' })
		target = document.createElement('div')
		document.body.appendChild(target)
		// Provide wraps FF_Form in <FF_Config cell={{ inputs: { text: TestInput } }}>
		const comp = mount(Provide, { target, props: { entity: Row, input: TestInput } })
		await vi.waitFor(() => expect(target.querySelector('input')).toBeTruthy())
		const input = target.querySelector('input') as HTMLInputElement
		input.value = 'updated'
		input.dispatchEvent(new Event('input', { bubbles: true }))
		flushSync()
		;(target.querySelector('[data-ff-form-save]') as HTMLButtonElement).click()
		await vi.waitFor(async () => expect((await repo(Row).findFirst())?.name).toBe('updated'))
		unmount(comp)
	})
})
```

Create the two tiny test helpers:

`src/lib/svelte/grid/_test/TestInput.svelte`:
```svelte
<script lang="ts">
	let { value = $bindable(), id }: { value?: unknown; id?: string } = $props()
</script>

<input {id} value={String(value ?? '')} oninput={(e) => (value = e.currentTarget.value)} />
```

`src/lib/svelte/grid/_test/Provide.svelte`:
```svelte
<script lang="ts">
	import type { ClassType, Component } from 'svelte'

	import FF_Config from '../../FF_Config.svelte'
	import FF_Form from '../FF_Form.svelte'

	let { entity, input }: { entity: ClassType<any>; input: Component } = $props()
</script>

<FF_Config cell={{ inputs: { text: input } }}>
	<FF_Form {entity} />
</FF_Config>
```

- [ ] **Step 3: Run the test (fail then pass)**

Run: `npx vitest run --project svelte src/lib/svelte/grid/FF_Form.svelte.spec.ts`
Expected: PASS (1 test) - it proves: cells render via the registry input, raw value binds, `r.save()` persists.

- [ ] **Step 4: Format + type check**

Run: `npm run format && npx svelte-check --tsconfig ./tsconfig.json --threshold error 2>&1 | tail -20`
Expected: confirm the `generics="T extends { id: string }"` attribute survived format (grep it) and no `svelte-check` errors. If format stripped the generic, re-add it and re-run.

- [ ] **Step 5: Commit**

```bash
git add src/lib/svelte/grid/FF_Form.svelte src/lib/svelte/grid/FF_Form.svelte.spec.ts src/lib/svelte/grid/_test
git commit -m "feat(grid): FF_Form - headless one-bound form over cells + input registry"
```

---

### Task 8: `FF_Grid.svelte` - headless read/sort/paginate/delete grid

**Files:**
- Create: `src/lib/svelte/grid/FF_Grid.svelte`
- Create: `src/lib/svelte/grid/FF_Grid.svelte.spec.ts`

- [ ] **Step 1: Write `FF_Grid.svelte`.** Builds its own `ff().many` (so it can own header-click sort by feeding `orderBy` into the reactive getter), renders columns via `buildCells`, cells via `cellSnippet ?? displayCell`, paginate `more`, and gated delete via `confirmRemove`.

```svelte
<script lang="ts" generics="T extends { id: string }">
	import { untrack } from 'svelte'
	import type { ClassType, EntityFilter, EntityOrderBy } from 'remult'

	import { ff, type FF_Many, type ManyStrategy } from '../ff.svelte.js'
	import { buildCells, displayCell } from './buildCells.js'
	import type { CellInput } from './cellTypes.js'

	type Props = {
		entity: ClassType<T>
		selected?: CellInput<T>[]
		where?: EntityFilter<T>
		orderBy?: EntityOrderBy<T>
		strategy?: ManyStrategy
		pageSize?: number
		enabled?: boolean
		/** Hide the trailing delete column even when allowed. */
		hideDelete?: boolean
	}
	let {
		entity,
		selected,
		where,
		orderBy,
		strategy = 'paginate',
		pageSize = 25,
		enabled = true,
		hideDelete = false,
	}: Props = $props()

	let sort = $state<EntityOrderBy<T> | undefined>(orderBy)

	const m = untrack(() =>
		ff(entity).many(() => ({ where, orderBy: sort, pageSize, enabled }), strategy),
	) as unknown as FF_Many<T, 'paginate'>

	const cells = $derived(buildCells(m.meta, selected))
	const showDelete = $derived(!hideDelete && m.meta.apiDeleteAllowed())

	function toggleSort(key: string) {
		const cur = (sort as Record<string, 'asc' | 'desc'> | undefined)?.[key]
		sort = { [key]: cur === 'asc' ? 'desc' : 'asc' } as EntityOrderBy<T>
	}
	const sortDir = (key: string) => (sort as Record<string, string> | undefined)?.[key]
</script>

<div data-ff-grid>
	{#if m.error}<p data-ff-grid-error>{m.error}</p>{/if}
	<table>
		<thead>
			<tr>
				{#each cells as cell (cell.col ?? cell.kind)}
					<th
						data-col={cell.col}
						style:text-align={cell.align}
						class={cell.class}
						onclick={() => cell.col && cell.kind === 'field' && toggleSort(cell.col)}
					>
						{cell.caption}{#if cell.col && sortDir(cell.col)}<span data-sort>{sortDir(cell.col) === 'asc' ? ' ▲' : ' ▼'}</span>{/if}
					</th>
				{/each}
				{#if showDelete}<th></th>{/if}
			</tr>
		</thead>
		<tbody>
			{#if m.loading.init}
				{#each Array(2) as _, i (i)}
					<tr>{#each cells as cell (cell.col ?? cell.kind)}<td><span data-sk></span></td>{/each}{#if showDelete}<td></td>{/if}</tr>
				{/each}
			{:else}
				{#each m.items as row (row.id)}
					<tr>
						{#each cells as cell (cell.col ?? cell.kind)}
							<td data-col={cell.col} style:text-align={cell.align} class={cell.class}>
								{#if cell.cellSnippet}{@render cell.cellSnippet({ row, cell })}{:else}{displayCell(cell, row)}{/if}
							</td>
						{/each}
						{#if showDelete}
							<td>
								<button
									data-ff-grid-del
									disabled={!m.meta.apiDeleteAllowed(row)}
									onclick={() => m.confirmRemove(row)}
								>
									Delete
								</button>
							</td>
						{/if}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>

	{#if strategy === 'paginate' && m.aggregates}<span data-ff-grid-count>{m.aggregates.$count}</span>{/if}
	{#if strategy === 'paginate' && m.hasNextPage}
		<button data-ff-grid-more disabled={m.loading.more} onclick={() => m.more()}>More</button>
	{/if}
	{#if !m.loading.init && m.items.length === 0}<p data-ff-grid-empty>Nothing yet.</p>{/if}
</div>
```

- [ ] **Step 2: Write the failing browser test** (`FF_Grid.svelte.spec.ts`):

```ts
import { flushSync, mount, unmount } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Entity, Fields, InMemoryDataProvider, remult, repo } from 'remult'

import FF_Grid from './FF_Grid.svelte'

@Entity('grid_row', { allowApiCrud: true, defaultOrderBy: { order: 'asc' } })
class Row {
	@Fields.id() id = ''
	@Fields.number() order = 0
	@Fields.string({ caption: 'Name' }) name = ''
}

let target: HTMLElement
beforeEach(() => {
	remult.dataProvider = new InMemoryDataProvider()
})
afterEach(() => target?.remove())

async function mountGrid(props: Record<string, unknown>) {
	target = document.createElement('div')
	document.body.appendChild(target)
	const comp = mount(FF_Grid, { target, props })
	await vi.waitFor(() => expect(target.querySelectorAll('tbody tr').length).toBeGreaterThan(0))
	return comp
}

describe('FF_Grid', () => {
	it('renders a header per column (caption from metadata) and a row per item', async () => {
		await repo(Row).insert([{ order: 1, name: 'a' }, { order: 2, name: 'b' }])
		const comp = await mountGrid({ entity: Row, selected: ['order', 'name'] })
		const headers = [...target.querySelectorAll('thead th')].map((t) => t.textContent?.trim())
		expect(headers).toContain('Name')
		expect(target.querySelectorAll('tbody tr').length).toBe(2)
		unmount(comp)
	})

	it('clicking a header toggles orderBy and re-fetches sorted', async () => {
		await repo(Row).insert([{ order: 1, name: 'a' }, { order: 2, name: 'b' }])
		const comp = await mountGrid({ entity: Row, selected: ['order', 'name'] })
		const firstNameBefore = target.querySelector('tbody tr td[data-col="name"]')?.textContent
		expect(firstNameBefore).toBe('a')
		;(target.querySelector('thead th[data-col="name"]') as HTMLElement).click()
		flushSync()
		;(target.querySelector('thead th[data-col="name"]') as HTMLElement).click() // -> desc
		await vi.waitFor(() =>
			expect(target.querySelector('tbody tr td[data-col="name"]')?.textContent).toBe('b'),
		)
		unmount(comp)
	})
})
```

- [ ] **Step 3: Run the test (fail then pass)**

Run: `npx vitest run --project svelte src/lib/svelte/grid/FF_Grid.svelte.spec.ts`
Expected: PASS (2 tests) - proves columns from metadata, rows from items, and header-click server sort via the reactive getter.

- [ ] **Step 4: Format + type check**

Run: `npm run format && npx svelte-check --tsconfig ./tsconfig.json --threshold error 2>&1 | tail -20`
Expected: generic attribute survived, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/svelte/grid/FF_Grid.svelte src/lib/svelte/grid/FF_Grid.svelte.spec.ts
git commit -m "feat(grid): FF_Grid - headless read/sort/paginate/delete over cells"
```

---

### Task 9: Boutique default `Input` + barrel exports + dev-app demo wiring

**Files:**
- Create: `src/boutique/grid/Input.svelte`
- Create: `src/boutique/grid/README.md`
- Create: `src/lib/svelte/grid/index.ts`
- Modify: `src/lib/svelte/index.ts`
- Modify: `src/modules/demo/Task.ts`
- Modify: `src/routes/ff-repo/+page.svelte`

- [ ] **Step 1: Write the boutique token-only `Input`** (`src/boutique/grid/Input.svelte`) - native, unstyled-but-themable, type-aware. Copy-own; never published (under `src/boutique`, excluded by `files: ["dist"]`):

```svelte
<script lang="ts">
	// Boutique default cell input. Copy into your app and restyle. Token-only (currentColor).
	let {
		value = $bindable(),
		id,
		type = 'text',
		placeholder,
	}: { value?: unknown; id?: string; type?: string; placeholder?: string } = $props()
</script>

{#if type === 'number'}
	<input {id} {placeholder} type="number" bind:value />
{:else if type === 'checkbox'}
	<input {id} type="checkbox" bind:checked={value as boolean} />
{:else}
	<input {id} {placeholder} type="text" value={String(value ?? '')} oninput={(e) => (value = e.currentTarget.value)} />
{/if}

<style>
	input {
		width: 100%;
		box-sizing: border-box;
		padding: 5px 7px;
		font: inherit;
		color: inherit;
		background: transparent;
		border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
		border-radius: 6px;
	}
	input[type='checkbox'] {
		width: auto;
	}
</style>
```

- [ ] **Step 2: Write `src/boutique/grid/README.md`**:

```md
# grid (boutique recipe)

A token-only default `Input` for firstly's headless `FF_Grid` / `FF_Form`. firstly ships **no**
styled component on purpose - copy this in and make it yours.

## Use

\`\`\`bash
npx degit jycouet/firstly/packages/firstly/src/boutique/grid src/lib/ff-grid
\`\`\`

Register it once at your app root so every cell of `inputType: 'text' | 'number' | 'checkbox'`
uses it:

\`\`\`svelte
<script lang="ts">
  import { FF_Config } from 'firstly/svelte'
  import Input from '$lib/ff-grid/Input.svelte'
</script>

<FF_Config cell={{ inputs: { text: Input, number: Input, checkbox: Input } }}>
  {@render children()}
</FF_Config>
\`\`\`

Then `<FF_Form entity={X} />` and `<FF_Grid entity={X} />` render with your input. Restyle
`Input.svelte` (or add `select` / `date` / `multiSelect` variants) to match your design system.
```

- [ ] **Step 3: Write the folder barrel** (`src/lib/svelte/grid/index.ts`):

```ts
export { buildCells, displayCell } from './buildCells.js'
export { getFieldMetaType } from './metaKind.js'
export { getStyle, getCellElementConfig, getInputType, defaultConfig } from './cellConfig.js'
export type {
	Cell,
	CellInput,
	CellUI,
	MetaKind,
	CellConfig,
	CellElementConfig,
	CellProps,
	CellContentProps,
	CellElementProps,
	CellMode,
} from './cellTypes.js'
export { default as FF_Cell } from './FF_Cell.svelte'
export { default as FF_Grid } from './FF_Grid.svelte'
export { default as FF_Form } from './FF_Form.svelte'
```

- [ ] **Step 4: Re-export from the public svelte barrel** (`src/lib/svelte/index.ts`). Add after the `DemoForm` export line:

```ts
export {
	FF_Cell,
	FF_Grid,
	FF_Form,
	buildCells,
	displayCell,
	getFieldMetaType,
	getInputType,
} from './grid/index.js'
export type { Cell, CellInput, CellUI, MetaKind, CellConfig, CellElementConfig } from './grid/index.js'
```

Also import the css once so consumers of `firstly/svelte` get `--ff-spacing` (add near the top of `index.ts`):
```ts
import './firstly.css'
```

- [ ] **Step 5: Enrich the demo entity** (`src/modules/demo/Task.ts`) - dev app only, gives the demo grid more than one column:

```ts
import { Entity, Fields } from 'remult'

@Entity('demo_tasks', { allowApiCrud: true, defaultOrderBy: { createdAt: 'desc' } })
export class Task {
	@Fields.id() id = ''
	@Fields.string({ caption: 'Task title', required: true, ui: { width: 60 } }) title = ''
	@Fields.number({ caption: 'Priority', ui: { width: 40, align: 'right' } }) priority = 0
	@Fields.boolean({ caption: 'Done' }) done = false
	@Fields.createdAt() createdAt = new Date()
}
```

- [ ] **Step 6: Mount the demos** (`src/routes/ff-repo/+page.svelte`). Add the imports + a section (keep the existing DemoGrid/DemoForm):

```svelte
<script lang="ts">
	import { FF_Config, FF_Grid, FF_Form } from 'firstly/svelte'
	import Input from '$boutique/grid/Input.svelte'
	// ...existing imports (DemoForm, DemoGrid, Task, etc.)
</script>

<!-- ...existing DemoGrid/DemoForm sections stay... -->

<h2>FF_Grid / FF_Form (headless + boutique skin)</h2>
<FF_Config cell={{ inputs: { text: Input, number: Input, checkbox: Input } }}>
	<FF_Grid entity={Task} selected={['title', 'priority', 'done']} pageSize={5} />
	<FF_Form entity={Task} selected={['title', 'priority', 'done']} />
</FF_Config>
```

Note: `$boutique` is not an existing alias. Either add `'$boutique': './src/boutique'` to the `kit.alias` block in `svelte.config.js`, or import via relative path `../../boutique/grid/Input.svelte`. Use the relative path to avoid touching config:
```svelte
	import Input from '../../boutique/grid/Input.svelte'
```

- [ ] **Step 7: Verify the dev app builds + type-checks**

Run: `npm run format && npx svelte-check --tsconfig ./tsconfig.json --threshold error 2>&1 | tail -25`
Expected: no errors. Then smoke the route renders (optional manual): `npm run dev` and open `/ff-repo` - the new FF_Grid shows title/priority/done columns with the boutique input; FF_Form edits a row.

- [ ] **Step 8: Commit**

```bash
git add src/boutique/grid src/lib/svelte/grid/index.ts src/lib/svelte/index.ts src/modules/demo/Task.ts src/routes/ff-repo/+page.svelte
git commit -m "feat(grid): boutique default Input + public exports + ff-repo demo wiring"
```

---

### Task 10: Full verification + changeset

**Files:**
- Create: `.changeset/cell-buildor-stage0.md`

- [ ] **Step 1: Run the whole test suite (both projects)**

Run: `npm run test:unit:ci 2>&1 | tail -30`
Expected: all node specs (`cellConfig`, `metaKind`, `buildCells`) + browser specs (`FF_Cell`, `FF_Form`, `FF_Grid`) pass, plus the pre-existing `ff` suite. Zero failures.

- [ ] **Step 2: Type-check the whole package**

Run: `npx svelte-check --tsconfig ./tsconfig.json --threshold error 2>&1 | tail -20`
Expected: 0 errors.

- [ ] **Step 3: Verify the published bundle resolves the new exports**

Run: `npm run compile 2>&1 | tail -20 && ls dist/esm/svelte/grid`
Expected: `compile` succeeds; `dist/esm/svelte/grid/` contains the compiled `FF_Grid`, `FF_Form`, `FF_Cell`, `buildCells`, etc. (proves svelte-package picked up the new folder and the barrel re-export is reachable as `firstly/svelte`).

- [ ] **Step 4: Write the changeset** (`.changeset/cell-buildor-stage0.md`) - keep it minimal per repo convention:

```md
---
'firstly': minor
---

Add headless `FF_Grid`, `FF_Form`, and `FF_Cell` plus a `buildCells` buildor (metadata-driven cells with a per-cell escape hatch). Style is configured once at the app root via the new `FF_Config` `cell` registry; firstly ships no styled input (a token-only default lives in the `grid` boutique recipe). `DemoGrid`/`DemoForm` are unchanged.
```

- [ ] **Step 5: Commit**

```bash
git add .changeset/cell-buildor-stage0.md
git commit -m "chore: changeset for cell-buildor stage 0"
```

---

## Self-Review notes (for the executor)

- **Spec coverage:** types+augmentation (T1), geometry/style (T2), config registry (T3), kind derivation (T4), buildor+display (T5), Cell port (T6), Form (T7), Grid (T8), boutique+exports+demo (T9), verify+changeset (T10). Every locked decision maps to a task: `ui` key=T1; `%`+mobile=T6; style-once=T3+T2; headless+boutique=T9; keep Demo*=untouched; escape hatch=T5 `cellSnippet`/`component`.
- **Known Stage 0 boundaries (intentional, fast-follow):** `displayCell` renders relations/multi-enum via `field.displayValue` only (rich relation caption resolution + the full Grid2 kind→render switch is deferred; use a `cellSnippet` meanwhile). `FF_Grid` is read+sort+paginate+delete (inline/dialog edit deferred). `FF_Form` is a single `ff().one` form (the many-draft/grid-row dialog edit is a Stage 1 GridPlus concern). These are the explicit seams to extend before/during Stage 1.
- **Type-consistency watch:** `getInputType(fo)` reads `fo.ui?.inputType` (not `cellUI`); `FF_Cell` prop is `ui` (not `cellUI`); `FF_Config.cell.inputs` is keyed by inputType string; `Cell.cellSnippet` signature is `Snippet<[{ row, cell }]>` in T1, T5, and T8 (matches).
- **Gotchas baked in:** browser-project naming (`*.svelte.spec.ts`), `untrack` around `ff().many`, raw-value bind (no `String()` coercion), per-field errors from caught `modelState` (not `h.error`), `{@html}` is trusted-only, `--ff-spacing`/`--muted-foreground`/`--destructive` given fallbacks, prettier-generics format check after every `.svelte` task.
