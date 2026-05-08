import { BackendMethod, remult } from 'remult'

import { Roles_Mail } from './Roles_Mail'

/** Split on commas, trim, lowercase, drop empties. */
function parseRecipients(raw: string | undefined): string[] {
	if (!raw) return []
	return raw
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean)
}

export class MailController {
	/**
	 * Drives the bundled `<WriteMail />` component. Sends a single-section
	 * mail through `remult.context.sendMail` (set by the `mail()` module) and
	 * returns the provider's `messageId` when available.
	 *
	 * Each of `to`, `cc`, `bcc` is a comma-separated string. Splitting,
	 * trimming, lowercasing, and per-entry validation happen here on the
	 * server - the client just hands over what the user typed.
	 */
	@BackendMethod({ allowed: Roles_Mail.Mail_Admin })
	static async sendTest(input: {
		to: string
		cc?: string
		bcc?: string
		subject: string
		body: string
	}) {
		if (import.meta.env.SSR) {
			if (!remult.context.sendMail) {
				throw new Error('mail module not registered (call mail() in remultApi.modules)')
			}

			const tos = parseRecipients(input.to)
			const ccs = parseRecipients(input.cc)
			const bccs = parseRecipients(input.bcc)

			if (tos.length === 0 && ccs.length === 0 && bccs.length === 0) {
				throw new Error('At least one recipient is required (to, cc, or bcc).')
			}
			const invalid = [...tos, ...ccs, ...bccs].find((e) => !e.includes('@'))
			if (invalid) {
				throw new Error(`Invalid email: "${invalid}"`)
			}

			const safe = (s: string) =>
				s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)

			const r = await remult.context.sendMail('test', {
				to: tos.length === 1 ? tos[0] : tos,
				cc: ccs.length ? (ccs.length === 1 ? ccs[0] : ccs) : undefined,
				bcc: bccs.length ? (bccs.length === 1 ? bccs[0] : bccs) : undefined,
				subject: input.subject,
				sections: [
					{
						html: `<p style="margin:0;white-space:pre-wrap;">${safe(input.body) || '<em>(no body)</em>'}</p>`,
					},
				],
			})
			return {
				ok: !!r.data,
				messageId: r.data?.messageId ?? null,
				error: r.error ? String((r.error as { message?: unknown }).message ?? r.error) : null,
			}
		}
		throw new Error('sendTest: server-only')
	}
}
