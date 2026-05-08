---
'firstly': patch
---

`firstly/mail`: export `MailSection`, persist nodemailer response into `Mail.metadata.transport` (so provider IDs like Resend's `re_...` are recoverable from the DB), ship drop-in `<WriteMail />` + `<LastMails />` admin components and a `MailController.sendTest` BackendMethod, plus a Resend docs section.
