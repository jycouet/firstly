---
'firstly': patch
---

feedback: `getIssues` returned nothing when `milestones.labels_filters` was unset (GitHub treats `labels: []` as "match nothing"); the filter is now omitted in that case.
