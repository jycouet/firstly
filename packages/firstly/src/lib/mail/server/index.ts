import type * as typeNodemailer from 'nodemailer'
import nodemailer from 'nodemailer'
import type JSONTransport from 'nodemailer/lib/json-transport'
// import type Mail from 'nodemailer/lib/mailer'
import type SendmailTransport from 'nodemailer/lib/sendmail-transport'
import type SESTransport from 'nodemailer/lib/ses-transport'
import type SMTPPool from 'nodemailer/lib/smtp-pool'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import type StreamTransport from 'nodemailer/lib/stream-transport'

import { remult } from 'remult'
import { cyan, green, magenta, red, sleep, white } from '@kitql/helpers'

import { ModuleFF } from '../../server'

export type TransportTypes =
	| SMTPTransport
	| SMTPPool
	| SendmailTransport
	| StreamTransport
	| JSONTransport
	| SESTransport
	| typeNodemailer.Transport<any>
// | DefaultOptions

export type DefaultOptions = typeNodemailer.SendMailOptions
// | SMTPTransport.Options
// | SMTPPool.Options
// | SendmailTransport.Options
// | StreamTransport.Options
// | JSONTransport.Options
// | SESTransport.Options
// | typeNodemailer.TransportOptions
// | typeNodemailer.SendMailOptions

export type MailOptions = {
	brandColor?: string

	nodemailer?: {
		transport?: TransportTypes
		defaults?: DefaultOptions
	}
}

let transporter: ReturnType<typeof typeNodemailer.createTransport>

let globalOptions: MailOptions | undefined

const initMail: (o?: MailOptions) => void = async (o) => {
	globalOptions = o

	if (o?.nodemailer?.transport) {
		transporter = nodemailer.createTransport(o?.nodemailer?.transport, o?.nodemailer?.defaults)
	} else {
		try {
			nodemailer.createTestAccount((err, account) => {
				if (account) {
					globalOptions = {
						...globalOptions,
						...{
							...globalOptions?.nodemailer,
							nodemailer: { defaults: { from: account.user } },
						},
					}

					transporter = nodemailer.createTransport({
						host: account.smtp.host,
						port: account.smtp.port,
						secure: account.smtp.secure,
						auth: {
							user: account.user,
							pass: account.pass,
						},
					})
				} else {
					mailModule.log.error("Error nodemailer.createTestAccount() can't be done.")
				}
			})
		} catch (error) {
			mailModule.log.error("Error nodemailer.createTestAccount() can't be done.")
		}
	}
}

declare module 'remult' {
	export interface RemultContext {
		sendMail?: SendMail
	}
}

export type SendMail = typeof sendMail

export const sendMail: (
	/** usefull for logs, it has NO impact on the mail itself */
	topic: string,
	mailOptions: Parameters<typeof transporter.sendMail>[0],
) => ReturnType<typeof transporter.sendMail> = async (topic, mailOptions) => {
	// if the transporter is not ready, wait for it! (it can happen only if nothing is set...)
	for (let i = 0; i < 30; i++) {
		if (transporter !== undefined) {
			break
		}
		await sleep(100)
	}
	try {
		if (!mailOptions.html) {
			const templateProps = {
				subject: mailOptions.subject,
			}
			try {
				// const { renderEmail } = await import('sailkit')
				// const { html, plainText } = await renderEmail(
				// 	// @ts-ignore
				// 	mailOptions.template ?? DefaultMail,
				// 	templateProps,
				// )

				// mailOptions.text = plainText
				// mailOptions.html = html
				mailOptions.text = 'test'
				mailOptions.html = 'test'
			} catch (error) {
				mailModule.log.error(`${magenta(`[${topic}]`)}`, error)
				mailModule.log.error(
					`${magenta(`[${topic}]`)}`,
					`missing ${red('mjml')} as dependency?! (it's a peer dependency of sailkit)`,
				)
			}
		}

		if (!globalOptions?.nodemailer?.transport) {
			const info = await transporter.sendMail({
				...mailOptions,
				...{ from: mailOptions.from ?? globalOptions?.nodemailer?.defaults?.from },
			})
			mailModule.log.error(`${magenta(`[${topic}]`)} - ⚠️  ${red(`mail not configured`)} ⚠️ 
			We are still nice and generated you an email preview link: 
			👉 ${cyan(
				String(
					nodemailer.getTestMessageUrl(
						// @ts-ignore
						info,
					),
				),
			)}
			
			To really send mails, check out the doc ${white(`https://firstly.fun/modules/mail`)}. 
      `)
			return info
		} else {
			const info = await transporter.sendMail({
				...mailOptions,
				...{ from: mailOptions.from ?? globalOptions?.nodemailer?.defaults?.from },
			})
			mailModule.log.success(
				`${magenta(`[${topic}]`)} - Sent to ${typeof mailOptions.to === 'string' ? green(mailOptions.to) : mailOptions.to}`,
			)
			return info
		}
	} catch (error) {
		if (error instanceof Error && error.message.includes('Missing credentials for "PLAIN"')) {
			mailModule.log.error(`${magenta(`[${topic}]`)} - ⚠️  ${red(`mail not well configured`)} ⚠️ 
👉 transport used:
${cyan(JSON.stringify(globalOptions?.nodemailer?.transport, null, 2))}
			`)
		} else {
			mailModule.log.error(`${magenta(`[${topic}]`)} - Error`, error)
		}
	}
}

const mailModule = new ModuleFF({
	name: 'mail',
	priority: -888,
})

export const mail: (o?: MailOptions) => ModuleFF = (o) => {
	mailModule.initApi = () => {
		initMail(o)
		// Need to init in the 2 places!
		remult.context.sendMail = sendMail
	}
	mailModule.initRequest = async () => {
		// Need to init in the 2 places!
		remult.context.sendMail = sendMail
	}
	return mailModule
}
