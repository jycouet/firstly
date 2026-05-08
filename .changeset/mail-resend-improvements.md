---
'firstly': patch
---

`firstly/mail`:

- Export `MailSection` from `firstly/mail` (client-shareable). Consumers building section arrays from a UI no longer need to reach into server-side types or duplicate the shape.
- Persist nodemailer's response (`messageId`, `response`, `accepted`, `rejected`, `envelope`, plus `preview` for test accounts) into `Mail.metadata.transport` on every send. Provider-side IDs - e.g. Resend's `re_...` returned via SMTP `messageId` - are now recoverable from the DB without a second request.
- Sharper logs when transport is missing or credentials are refused: the "not configured" path now prints a copy-paste Resend snippet, and the `Missing credentials for "PLAIN"` path explicitly names the API key as the likely cause.

Docs: a new "Send via Resend" section walks through the SMTP transport config and the DNS records needed to verify a sending domain.
