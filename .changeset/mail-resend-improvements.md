---
'firstly': patch
---

`firstly/mail`: export `MailSection`, persist nodemailer response into `Mail.metadata.transport` (so provider IDs like Resend's `re_...` are recoverable from the DB), and add a Resend docs section.
