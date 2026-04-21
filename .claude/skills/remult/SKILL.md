---
name: remult
description: Generic Remult patterns - entities, repo(), relations, permissions, enums, lifecycle hooks, BackendMethods, and migrations. Use whenever writing or modifying Remult entities, controllers, or server config, or when the user mentions `@Entity`, `repo()`, `@Fields`, `@Relations`, `BackendMethod`, `allowApi*`, `ValueListFieldType`, or data migrations. Framework-agnostic (SvelteKit, Next, Express, etc.).
---

# Remult Patterns

Opinionated patterns for Remult. **Read existing code first before writing new code.**

## `repo()` Usage

**Never store `repo(Entity)` in a variable.** Call it inline - cheap, readable, no staleness risk.

```ts
// BAD
const repoTask = repo(Task)
await repoTask.find(...)

// GOOD
await repo(Task).find(...)
```

## Entity ID Field

**Always use `@Fields.id()` for primary keys.** Never `@Fields.autoIncrement()` - UUIDs avoid collision on merge/replication and don't leak row counts.

```ts
@Entity('tasks', { allowApiCrud: true })
export class Task {
  @Fields.id()
  id!: string

  @Fields.string()
  title = ''
}
```

## Entity Lifecycle Hooks

Use `saved` for creating related records, `saving` for computing fields from relations.

```ts
@Entity<Task>('tasks', {
  saving: async (entity) => {
    // Populate derived fields from relations before write
    if (entity.categoryId) {
      const cat = await repo(Category).findId(entity.categoryId)
      if (cat) entity.categoryName = cat.name
    }
  },
  saved: async (entity, event) => {
    if (event.isNew) {
      // Side effects on creation
      await repo(AuditLog).insert({ entity: 'Task', entityId: entity.id })
    }
  },
})
```

**Client stays simple:** `await repo(Task).insert({ title: 'hi' })`.

## When `BackendMethod` is Needed

Don't reach for it by default - entity hooks + `allowApi*` cover most cases. Use `BackendMethod` when:

| Use case | Example |
| --- | --- |
| Multi-entity transaction | Create Order + OrderLines + charge payment atomically |
| Complex aggregation | Dashboard with many parallel queries, returned as one payload |
| Cross-entity workflow | Clone a Quote with all children |
| Server-only data | Queries on entities not exposed to the client |

## Enums (`ValueListFieldType`)

```ts
import { ValueListFieldType, getValueList } from 'remult'

@ValueListFieldType()
export class TaskStatus {
  static Todo = new TaskStatus('todo', { caption: 'To do', order: 10 })
  static Done = new TaskStatus('done', { caption: 'Done', order: 20 })

  constructor(
    public id: string,
    public meta: { caption: string; order: number },
  ) {}
}
```

**Iterate with `getValueList()` - never hand-roll a static `all()` method.**

```ts
for (const s of getValueList(TaskStatus)) {
  // s.meta.caption, s.meta.order available
}
```

**Order values in increments of 10** (`10, 20, 30...`) so you can insert between later without renumbering.

## Permissions - Entity-Level, Not UI-Level

**Define rules once on the entity, read them in the UI via `metadata.*Allowed`.** Never duplicate the logic in components.

```ts
@Entity<Task>('tasks', {
  allowApiUpdate: (item) => item?.ownerId === remult.user?.id,
  allowApiDelete: Allow.authenticated,
})
```

In the UI:

```ts
const canEdit = repo(Task).metadata.apiUpdateAllowed(item)
const canDelete = repo(Task).metadata.apiDeleteAllowed(item)
const canInsert = repo(Task).metadata.apiInsertAllowed // no item
```

## Relations

```ts
@Entity('tasks', { allowApiCrud: true })
export class Task {
  @Fields.id() id!: string
  @Fields.string() title = ''

  @Fields.string() categoryId = ''
  @Relations.toOne(() => Category, 'categoryId')
  category?: Category
}
```

Include in queries:

```ts
await repo(Task).find({ include: { category: true } })
```

## Junction Tables (Many-to-Many)

Use `saving` to snapshot fields from the related side (denormalize intentionally, avoid extra joins at read time):

```ts
@Entity<TaskTag>('task_tags', {
  saving: async (entity) => {
    const tag = await repo(Tag).findId(entity.tagId)
    if (tag) entity.tagName = tag.name
  },
})
```

## Migrations

- **Schema changes** (new tables/columns) - auto-generated at app boot.
- **Data migrations** - append manually to `migrations.ts`, keyed by number.

```ts
// migrations.ts
export const migrations = {
  40: async ({ sql }) => {
    await sql(`UPDATE "tasks" SET "status" = 'todo' WHERE "status" IS NULL`)
  },
}
```

Numbering is monotonic - never reuse or reorder a number once shipped.
