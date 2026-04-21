---
name: remult
description: Remult entity patterns, GridPlus, forms, relations, permissions, enums, and lifecycle hooks for this monorepo. Use this skill whenever writing or modifying Remult entities, creating CRUD pages, building forms with storeItem/FieldGroup/cellsBuildor, configuring GridPlus, adding entity relations, or working with permissions and enums. Also use when the user mentions entities, repo(), fields, or asks how to build a form or list page.
---

# Remult Patterns

Patterns for Remult in this monorepo. **Read existing code first before writing new code.**

## repo() Usage

**NEVER store `repo(Entity)` in a variable.** Always call `repo(Entity)` directly inline.

```typescript
// BAD
const repoXxx = repo(Entity)
await repoXxx.find(...)

// GOOD
await repo(Entity).find(...)
```

## Entity ID Field

**ALWAYS use `@Fields.id()` for entity primary keys.** Never use `@Fields.autoIncrement()`.

## Route Patterns

| Type                | Pattern                  | Example                            |
| ------------------- | ------------------------ | ---------------------------------- |
| List                | Generic `[[tab]]/[crud]` | `/app/passations`                  |
| Detail (integer ID) | `[id=integer]`           | `/app/site/[id=integer]`           |
| Detail (UUID)       | `[id]`                   | `/app/passation/[id]`              |
| Filtered tab        | Parent route + entity    | `/app/site/[id=integer]/passation` |

## GridPlus (Always Use This, Never Grid)

**Always use `<GridPlus>`, never `<Grid>`.** GridPlus covers all use cases and integrates with entity `app.list` config.

### For Sub-Entity Lists

**Entity** defines base config:

```typescript
app: {
  list: {
    cells: ['peopleSe', 'isMandatory'],
    insert: { cells: ['peopleSe', 'isMandatory'] },
    delete: {},
  },
}
```

**Component** passes FK defaults:

```svelte
<script lang="ts">
	import { GridPlus, type TCrud } from '@app/common'

	const list: TCrud<Entity> = {
		where: { parentId },
		insert: { defaults: { parentId } },
	}
</script>

<GridPlus entity={Entity} {list} hideStats />
```

## Entity Lifecycle Hooks

Use `saved` hook for creating related entities on insert:

```typescript
@FF_Entity<Passation>('passations', {
  saved: async (entity, event) => {
    if (event.isNew) {
      // Create template items
      for (const label of LabelEnum.all()) {
        await repo(Item).insert({ passationId: entity.id, label })
      }
      // Add owner as participant
      const user = await repo(User).findId(entity.ownerId)
      if (user?.peopleSeId) {
        await repo(Participant).insert({ passationId: entity.id, peopleSeId: user.peopleSeId })
      }
    }
  },
})
```

**Client is simple:** `await repo(Passation).insert({ siteId: 123 })`

## When BackendMethod is Actually Needed

| Use Case                  | Example                                       |
| ------------------------- | --------------------------------------------- |
| Multi-entity transactions | Create Quote + Periods + Materials atomically |
| Complex aggregations      | Stock study with 5 parallel queries           |
| Cross-entity logic        | Clone quote with all related data             |
| Server-only data          | Queries on entities not exposed to client     |

## Remult Enums

```typescript
@ValueListFieldType()
export class MyStatusEnum extends BaseEnum {
	static OK = new MyStatusEnum('OK', { caption: 'Disponible', order: 10 })
	static NOT_OK = new MyStatusEnum('NOT_OK', { caption: 'Indisponible', order: 20 })
}
```

### Iterating Enum Values

Use `getValueList()` from Remult - **never create custom static `all()` methods**:

```typescript
// Don't create custom static methods
static all() { return [this.OK, this.NOT_OK] }

// Use getValueList()
import { getValueList } from 'remult'
for (const item of getValueList(MyStatusEnum)) {
  // item.order, item.caption available
}
```

### Order Values

Use increments of 10 (10, 20, 30...) to allow inserting items between existing ones later.

## Permission Checks in UI

**Always use entity-level permissions, never duplicate logic in UI.**

### Entity Definition

```typescript
@FF_Entity<MyEntity>('my_entities', {
  allowApiUpdate: (item) => item?.ownerId === remult.user?.id,
})
```

### UI Check

```svelte
<script lang="ts">
	const canEdit = $derived(
		$store.item ? repo(MyEntity).metadata.apiUpdateAllowed($store.item) : false,
	)
</script>

{#if canEdit}
	<FormButtons bind:edit />
{/if}
```

**Available methods:**

- `repo(Entity).metadata.apiUpdateAllowed(item)` - Can update this item?
- `repo(Entity).metadata.apiDeleteAllowed(item)` - Can delete this item?
- `repo(Entity).metadata.apiInsertAllowed` - Can insert new items? (no item param)

## Form Pattern (storeItem + FieldGroup)

```svelte
<script lang="ts">
	import { repo } from 'remult'
	import { cellsBuildor, FieldGroup, storeItem } from 'firstly/internals'

	const store = storeItem(repo(MyEntity))
	const cells = cellsBuildor(repo(MyEntity), ['field1', 'field2'])

	$effect(() => {
		store.fetch(id)
	})
</script>

{#if $store.item}
	<FieldGroup {cells} {store} mode={edit ? 'edit' : 'view'} />
{/if}
```

### cellsBuildor Options

```typescript
const cells = cellsBuildor(repo(Entity), [
	'field1', // Simple
	{ col: 'notes', class: 'col-span-2' }, // Grid positioning
	{ col: 'total', modeEdit: 'view' }, // Read-only in edit
	{ col: 'relation', clearable: true }, // Optional relation
])
```

## Entity Relations = Automatic Dropdowns

```typescript
@Relations.toOne(() => AccountGroup, { field: 'accountGroupId', caption: 'Groupe' })
accountGroup?: AccountGroup
```

Use in cells: `{ col: 'accountGroup', clearable: true }` -> dropdown automatic!

## dialog.form() for Quick Edit Modals

```typescript
const res = await dialog.form('update', 'Title', repo(Entity), {
	cells,
	defaults: entity,
})
if (res.success) {
	/* handle res.item */
}
```

## Junction Tables (Many-to-Many)

Use `saving` hook to auto-populate computed fields from relations:

```typescript
async saving(entity) {
  const related = await repo(Related).findId(entity.relatedId)
  if (related) entity.price = related.price
}
```

## Migrations

- **Schema changes** (new tables, columns) -> Auto-generated when app runs
- **Data migrations** -> Manually append to `migrations.ts`

```typescript
40: async ({ sql }) => {
  await sql(`UPDATE "table" SET "field" = 'value' WHERE ...`)
}
```
