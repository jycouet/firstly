import type * as typeNodemailer from 'nodemailer'
import nodemailer from 'nodemailer'
import type JSONTransport from 'nodemailer/lib/json-transport'
// import type Mail from 'nodemailer/lib/mailer'
import type SendmailTransport from 'nodemailer/lib/sendmail-transport'
import type SESTransport from 'nodemailer/lib/ses-transport'
import type SMTPPool from 'nodemailer/lib/smtp-pool'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import type StreamTransport from 'nodemailer/lib/stream-transport'

import { remult, repo } from 'remult'
import { Module } from 'remult/server'
import { cyan, green, magenta, red, sleep, white } from '@kitql/helpers'

import { log, mailEntities } from '../index'
import { toHtml, type MailStyle } from './formatMailHelper'

declare module 'remult' {
	export interface RemultContext {
		sendMail?: SendMail
	}
}

export type TransportTypes =
	| SMTPPool
	| SMTPPool.Options
	| SendmailTransport
	| SendmailTransport.Options
	| StreamTransport
	| StreamTransport.Options
	| JSONTransport
	| JSONTransport.Options
	| SESTransport
	| SESTransport.Options
	| SMTPTransport
	| SMTPTransport.Options
	| string

export type DefaultOptions = typeNodemailer.SendMailOptions

type GlobalEasyOptions = {
	saveHtml?: boolean
	from?: DefaultOptions['from']

	service?: string
	primaryColor?: string
	secondaryColor?: string
	footer?: string

	toHtml?: (args: MailStyle) => string
}

export type MailOptions = GlobalEasyOptions & {
	nodemailer?: {
		transport?: TransportTypes
		defaults?: DefaultOptions
	}
}

let transporter: ReturnType<typeof typeNodemailer.createTransport>

let globalOptions: MailOptions | undefined

const initMail: (o?: MailOptions) => void = async (o) => {
	globalOptions = {
		...o,
		nodemailer: {
			...o?.nodemailer,
			defaults: {
				from: o?.from,
				...o?.nodemailer?.defaults,
			},
		},
	}

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
							nodemailer: {
								defaults: { from: account.user },
							},
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
					log.error("Error nodemailer.createTestAccount() can't be done.")
				}
			})
		} catch (error) {
			log.error("Error nodemailer.createTestAccount() can't be done.")
		}
	}
}

export type SendMail = typeof sendMail
export const sendMail: (
	/** usefull for logs, it has NO impact on the mail itself */
	topic: string,
	easyOptions: GlobalEasyOptions & {
		to: Required<DefaultOptions>['to']
		subject: Required<DefaultOptions>['subject']
		title?: string
		sections: {
			html: string
			cta?: { html: string; link: string } | undefined
		}[]
	},
	options?: { nodemailer?: MailOptions['nodemailer'] },
) => ReturnType<typeof transporter.sendMail> = async (topic, easyOptions, options) => {
	let { nodemailer: nodemailerOptions } = options ?? {}
	const easyOptionsToUse = {
		...easyOptions,
		service: easyOptions.service ?? globalOptions?.service,
		primaryColor: easyOptions.primaryColor ?? globalOptions?.primaryColor,
		secondaryColor: easyOptions.secondaryColor ?? globalOptions?.secondaryColor,
		footer: easyOptions.footer ?? globalOptions?.footer,
		from: easyOptions.from ?? globalOptions?.from,
	}

	let { primaryColor, secondaryColor, title, footer, service } = easyOptionsToUse
	const { subject, sections, to } = easyOptionsToUse

	service = service ?? 'service'
	primaryColor = primaryColor ?? '#0d0f70'
	secondaryColor = secondaryColor ?? '#653eae'
	title = title ?? subject ?? 'subject'
	footer = footer ?? 'The team wishes you a great day 🚀'

	const metadata = {
		service,
		primaryColor,
		secondaryColor,
		subject,
		title,
		footer,
		sections,
	}
	const html = easyOptionsToUse.toHtml ? easyOptionsToUse.toHtml(metadata) : toHtml(metadata)

	nodemailerOptions = {
		defaults: {
			...globalOptions?.nodemailer?.defaults,
			to,
			subject,
			html,
			...nodemailerOptions?.defaults,
			from: easyOptionsToUse.from ?? globalOptions?.from,
		},
	}

	// if the transporter is not ready, wait for it! (it can happen only if nothing is set...)
	for (let i = 0; i < 30; i++) {
		if (transporter !== undefined) {
			break
		}
		await sleep(100)
	}
	try {
		if (!globalOptions?.nodemailer?.transport) {
			const info = await transporter.sendMail({ ...nodemailerOptions.defaults })
			log.error(`${magenta(`[${topic}]`)} - ⚠️  ${red(`mail not configured`)} ⚠️ 
		We are still nice and generated you an email preview link (the mail we not really sent): 
		👉 ${cyan(String(nodemailer.getTestMessageUrl(info)))}
			
		To really send mails, check out the doc ${white(`https://firstly.fun/modules/mail`)}. 
      `)
			await repo(mailEntities.Mail).insert({
				status: 'transport_not_configured',
				to: JSON.stringify(to),
				html: easyOptionsToUse.saveHtml ? html : '',
				topic,
				metadata,
			})
			return info
		} else {
			const info = await transporter.sendMail({ ...nodemailerOptions.defaults })
			log.success(
				`${magenta(`[${topic}]`)} - Sent to ${typeof nodemailerOptions.defaults?.to === 'string' ? green(nodemailerOptions.defaults?.to) : nodemailerOptions.defaults?.to}`,
			)
			await repo(mailEntities.Mail).insert({
				status: 'sent',
				to: JSON.stringify(to),
				html: easyOptionsToUse.saveHtml ? html : '',
				topic,
				metadata,
			})
			return info
		}
	} catch (error) {
		if (error instanceof Error && error.message.includes('Missing credentials for "PLAIN"')) {
			log.error(`${magenta(`[${topic}]`)} - ⚠️  ${red(`mail not well configured`)} ⚠️ 
👉 transport used:
${cyan(JSON.stringify(globalOptions?.nodemailer?.transport, null, 2))}
			`)
		} else {
			log.error(`${magenta(`[${topic}]`)} - Error`, error)
		}
		await repo(mailEntities.Mail).insert({
			status: 'error',
			errorInfo: JSON.stringify(error),
			to: JSON.stringify(to),
			html: easyOptionsToUse.saveHtml ? html : '',
			topic,
			metadata,
		})
		throw error
	}
}

const mailModule = new Module({
	key: 'mail',
	priority: -888,
	entities: Object.values(mailEntities),
})

export const mail: (o?: MailOptions) => Module<unknown> = (o) => {
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
