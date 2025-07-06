import { BackendMethod, remult } from 'remult'

export class MailController {
	/**
	 * Sets the completion status of all tasks.
	 * @param {boolean} completed - The completion status to set for all tasks.
	 */
	@BackendMethod({ allowed: true })
	static async sendMail() {
		remult.context!.sendMail!('test', {
			to: 'jj@tt.fr',
			subject: 'Working ?',
			sections: [
				{
					html: '<b>section 1</b>',
				},
				{
					html: 'Did you star remult repo ?',
					cta: {
						html: 'Star it',
						link: 'https://github.com/remult/remult',
					},
				},
			],
		})
	}
}
