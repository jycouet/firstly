---
name: sql-optimizer
description: 'Decide Postgres indexes for a Remult app from its real queries, with EXPLAIN evidence. Use when the user mentions a slow query, missing / unused indexes, a Seq Scan or Sort in a plan, NULL sort order, or asks which index to add and where.'
---

# SQL optimizer

The plan is the source of truth: every index you recommend comes with its before / after plan from `sql-opt compare`. Candidates from `suggest` are starting points.

`sql-opt` ships with firstly as the `ff-sql-opt` bin (`npx ff-sql-opt`; inside the firstly repo, `pnpm compile` then `node dist/bin/ff-sql-opt.js`): `help` lists every command and flag. It prints JSON, runs against a local database (`DATABASE_URL`), and builds each candidate index inside a rolled back transaction, so the database ends as it started.

## Loop

1. **Volume.** Point `DATABASE_URL` at a database with production-like row counts (restore a dump, or seed). Done when `schema <table>` shows realistic `rows` and `analyzed: true` for the tables in play (a restored dump or a clone has no planner stats: `ANALYZE` it). Below ~1k rows a Seq Scan is the right plan and every comparison is noise.
2. **Capture.** Wire it once on the server, then run the tests / click through the app with `FF_SQL_CAPTURE=tmp/sql-capture.jsonl`:
   ```ts
   import { withSqlCapture } from 'firstly/sqlOptimizer/server'
   SqlDatabase.LogToConsole = withSqlCapture((...a) => FF_LogToConsole(...a))
   ```
   Unset env = untouched logging, so it can stay. Each query carries its route and request, so frequency is real: click the app the way users do, the pages they live on several times, not every page once. Done when `top` lists the queries of the flow you care about and `routes` shows them under their routes.
3. **Rank.** `top --by total --explain` (cost to the app, `share` of all captured ms) and `--by max --explain` (the one slow page). Captured ms is the app round trip, pool wait included; `dbMs` is the database alone. Pick queries where `dbMs` is high: a big gap between the two is load, not an index problem. `routes` ranks routes by cost; `mostRepeated.perRequest` (and `maxPerRequest` in `top`) above 2 is N+1.
4. **Compare**, per picked query: `compare <id>` runs the baseline and every uncovered suggestion; `--variant "<spec>"` replaces them with your own (unique, gin, expression, partial, several indexes at once: syntax in `help`). Read `tree`: the win is the Sort node gone, the Seq Scan turned into an Index (Only) Scan, `rowsRemovedByFilter` near zero. `speedup: null` means the planner ignored the index. `winner` already applies the noise floor and picks the simplest of near-ties. `impact.savedMs` (calls x ms saved) is what the index is worth: a x4 on a query run twice loses to x1.3 on the one every request runs. Pass `--calls` when production frequency is known (`pg_stat_statements`). Save each output to a file. Done when every picked query has a winner or a reason it needs none.
5. **Consolidate.** One index often serves several queries (same equality columns, same sort). Re-run `compare <id> --variant` with the shared index on each query it should serve, and prefer the one index over several near-twins. Check `audit` for indexes made redundant by yours.
6. **Recommend.** `report <compare files> --md` ranks the winners by `savedMs`: lead with that order. Per index: the table and columns, the query ids it serves, baseline vs winner ms and plan lines, and the `initApi` line(s) from `winner.ddl` (or `ddl <table> "<spec>"`). Indexes ship as code in the app's `initApi` (or the module's), with `sqlCreateIndex` from `firstly/sqlAdmin/server` when it fits, raw SQL when `ddl` says it can't. Find the entity with `@Entity('<table>')` / `FF_Entity('<table>')` and map db column names back to field keys.

## NULLS order

Postgres uses an index for a sort only when each column's direction and NULL placement match (or are all flipped: a backward scan), NOT NULL columns included. The query decides: with `NullSort.order` set, Remult writes the NULL order on allowNull columns, and `sqlCreateIndex` builds the matching `_NF` variant. Keep the sort exactly as the captured SQL writes it; `suggest` already does.

## Beyond indexes

The slowest queries are often shaped wrong, and no index fixes them: an sqlExpression sub-select run per row, a list without limit, a `count()` used as an existence check, the same lookup on every request. Report them with their ids and `dbMs`, next to the indexes.

## Cost side

Every index slows writes and takes space. Recommend one only for a real gain on a query that matters (`top` total), and say what it costs (`schema` sizes, write-heavy table or not).
