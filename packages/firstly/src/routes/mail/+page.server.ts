import { renderEmail } from 'sailkit'
import DefaultMail from '$lib/mail/templates/DefaultMail.svelte'

export const load = async () => {
	const { html, plainText } = await renderEmail(DefaultMail, {
		subject: 'firstly 👋',
		preview: 'This is the mail you were waiting for',
		title: 'firstly 👋',
		sections: [
			{
				text: 'Then, How are you today ?',
			},
			{
				text: 'Did you star the repo ?',
				cta: { text: 'Check it out', link: 'https:github.com/jycouet/firstly' },
			},
		]
	})

	return {
		html,
		plainText
	}
}