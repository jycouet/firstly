---
'firstly': patch
---

`firstly/mail`: export `MailSection`, persist nodemailer response into `Mail.metadata.transport` (so provider IDs like Resend's `re_...` are recoverable from the DB), ship drop-in `<WriteMail />` + `<LastMails />` admin components and an opt-in `MailController.sendTest` BackendMethod (`mail({ enableTest: true })`), plus a Resend docs section. Root: new `errorMessage(err)` helper that handles native `Error`, remult `ErrorInfo` rejections, and falls back to JSON instead of `[object Object]`.
