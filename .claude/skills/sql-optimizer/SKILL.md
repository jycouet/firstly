---
name: sql-optimizer
description: 'Decide Postgres indexes for a Remult app from its real queries, with EXPLAIN evidence. Use when the user mentions a slow query, missing / unused indexes, a Seq Scan or Sort in a plan, NULL sort order, or asks which index to add and where.'
---

# SQL optimizer

The plan is the source of truth: every index you recommend comes with its before / after plan from `sql-opt compare`. Candidates from `suggest` are starting points.

`sql-opt` lives in firstly: `pnpm -F firstly sql-opt help` lists every command and flag. It prints JSON, runs against a local database (`DATABASE_URL`), and builds each candidate index inside a rolled back transaction, so the database ends as it started.

## Loop

1. **Volume.** Point `DATABASE_URL` at a database with production-like row counts (restore a dump, or seed). Done when `schema <table>` shows realistic `rows` for the tables in play: below ~1k rows a Seq Scan is the right plan and every comparison is noise.
2. **Capture.** Wire it once on the server, then run the tests / click through the app with `FF_SQL_CAPTURE=tmp/sql-capture.jsonl`:
   ```ts
   SqlDatabase.LogToConsole = withSqlCapture((...a) => FF_LogToConsole(...a))
   ```
   Unset env = untouched logging, so it can stay. Done when `top` lists the queries of the flow you care about.
3. **Rank.** `top --by total` (cost to the app) and `--by max` (the one slow page). Pick queries by total time, not by count.
4. **Compare**, per picked query: `compare <id>` runs the baseline and every uncovered suggestion; add your own with `--variant "<cols>"`. Read `tree`: the win is the Sort node gone, the Seq Scan turned into an Index (Only) Scan, `rowsRemovedByFilter` near zero. A variant with `usesIndex: false` is ignored by the planner, whatever its timing. Done when every picked query has a winner or a reason it needs none.
5. **Consolidate.** One index often serves several queries (same equality columns, same sort). Re-run `compare <id> --variant` with the shared index on each query it should serve, and prefer the one index over several near-twins. Check `audit` for indexes made redundant by yours.
6. **Recommend.** Per index: the table and columns, the query ids it serves, baseline vs winner ms and plan lines, and the `initApi` line from `winner.ddl` (or `ddl <table> "<cols>"`). Indexes ship as code in the app's `initApi` (or the module's), with `sqlCreateIndex` from `firstly/sqlAdmin/server` when it fits, raw SQL when `ddl` says it can't. Find the entity with `@Entity('<table>')` / `FF_Entity('<table>')` and map db column names back to field keys.

## NULLS order

Postgres uses an index for a sort only when each column's direction and NULL placement match (or are all flipped: a backward scan), NOT NULL columns included. The query decides: with `NullSort.order` set, Remult writes the NULL order on allowNull columns, and `sqlCreateIndex` builds the matching `_NF` variant. Keep the sort exactly as the captured SQL writes it; `suggest` already does.

## Cost side

Every index slows writes and takes space. Recommend one only for a real gain on a query that matters (`top` total), and say what it costs (`schema` sizes, write-heavy table or not).
