import { BackendMethod, remult } from 'remult'

export class MailController {
	/**
	 * Sets the completion status of all tasks.
	 * @param {boolean} completed - The completion status to set for all tasks.
	 */
	@BackendMethod({ allowed: true })
	static async sendMail() {
		remult.context!.sendMail!('test', {
			to: 'hello@example.com',
			subject: 'Hello from firstly',
			sections: [
				{ html: 'hello <b>world</b> 👋' },
				{
					html: 'Did you star remult repo ?',
					cta: { html: 'Star it', link: 'https://github.com/remult/remult' },
				},
			],
		})
	}
}
