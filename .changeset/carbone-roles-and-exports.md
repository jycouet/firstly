---
'firstly': patch
---

fix(carbone): export `Roles_Carbon` under its real name (was wrongly aliased to `Roles_Mail`, colliding with `firstly/mail`).

Also expose `CarboneController` and the carbone entity classes from `firstly/carbone`, and `changeLogEntities` from `firstly/changeLog`, so consumers no longer need deep file imports.
