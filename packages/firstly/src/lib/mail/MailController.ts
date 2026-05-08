import { BackendMethod, remult } from 'remult'

import { Roles_Mail } from './Roles_Mail'

export class MailController {
	/**
	 * Drives the bundled `<WriteMail />` component. Sends a single-section
	 * mail through `remult.context.sendMail` (set by the `mail()` module) and
	 * returns the provider's `messageId` when available.
	 */
	@BackendMethod({ allowed: Roles_Mail.Mail_Admin })
	static async sendTest(input: { to: string; subject: string; body: string }) {
		if (import.meta.env.SSR) {
			if (!remult.context.sendMail) {
				throw new Error('mail module not registered (call mail() in remultApi.modules)')
			}
			const safe = (s: string) =>
				s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)
			const r = await remult.context.sendMail('test', {
				to: input.to,
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
