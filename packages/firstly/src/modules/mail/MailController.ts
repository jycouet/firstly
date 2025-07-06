import { BackendMethod, remult } from 'remult'

export class MailController {
	/**
	 * Sets the completion status of all tasks.
	 * @param {boolean} completed - The completion status to set for all tasks.
	 */
	@BackendMethod({ allowed: true })
	static async sendMail() {
		remult.context!.sendMail!('test', {
			to: 'jycouet@gmail.com',
			subject: 'firstly 👋',

			html: 'coucou <b>html</b>',
			text: 'coucou text',

			// preview: 'This is the mail you were waiting for',
			// title: 'firstly 👋',
			// to: 'jycouet@gmail.com',
			// sections: [
			// 	{
			// 		text: 'Then, How are you today ?',
			// 	},
			// ],
		})
	}
}
