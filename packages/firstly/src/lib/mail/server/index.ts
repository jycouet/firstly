import type * as typeNodemailer from 'nodemailer'
import nodemailer from 'nodemailer'
import type JSONTransport from 'nodemailer/lib/json-transport'
import type Mail from 'nodemailer/lib/mailer'
import type SendmailTransport from 'nodemailer/lib/sendmail-transport'
import type SESTransport from 'nodemailer/lib/ses-transport'
import type SMTPPool from 'nodemailer/lib/smtp-pool'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import type StreamTransport from 'nodemailer/lib/stream-transport'
import type { ComponentProps, ComponentType, SvelteComponent } from 'svelte'
import { asClassComponent } from 'svelte/legacy'
import { render } from 'svelty-email'

import { remult } from 'remult'
import { cyan, green, magenta, red, sleep, white } from '@kitql/helpers'

import { Module } from '../../server'
import { default as DefaultMail } from '../templates/DefaultMail.svelte'

export type TransportTypes =
	| SMTPTransport
	| SMTPPool
	| SendmailTransport
	| StreamTransport
	| JSONTransport
	| SESTransport
	| typeNodemailer.Transport<any>
	| DefaultOptions

export type DefaultOptions =
	| SMTPTransport.Options
	| SMTPPool.Options
	| SendmailTransport.Options
	| StreamTransport.Options
	| JSONTransport.Options
	| SESTransport.Options
	| typeNodemailer.TransportOptions

export type MailOptions<ComponentTemplateDefault extends SvelteComponent> = {
	from?: Mail.Options['from']
	template?: {
		component?: ComponentType<ComponentTemplateDefault>
		brandColor?: string
	}
	transport?: TransportTypes
	defaults?: DefaultOptions
	apiUrl?: Parameters<typeof typeNodemailer.createTestAccount>[0]
}

let transporter: ReturnType<typeof typeNodemailer.createTransport>

let globalOptions: MailOptions<SvelteComponent> | undefined

const initMail: (o?: MailOptions<SvelteComponent>) => void = async (o) => {
	globalOptions = o

	if (o?.transport) {
		transporter = nodemailer.createTransport(o?.transport, o?.defaults)
	} else {
		try {
			nodemailer.createTestAccount(globalOptions?.apiUrl ?? '', (err, account) => {
				if (account) {
					globalOptions = { ...globalOptions, from: account.user }

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
		/** Better checking is it's present or not, that's why it's "?" */
		sendMail?: SendMail
	}
}

export type SendMail = typeof sendMail

export const sendMail: <ComponentTemplateDefault extends SvelteComponent = DefaultMail>(
	/** usefull for logs, it has NO impact on the mail itself */
	topic: string,
	mailOptions: Parameters<typeof transporter.sendMail>[0] & {
		templateProps?: ComponentProps<ComponentTemplateDefault> | undefined
	},
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
			const template = asClassComponent(globalOptions?.template?.component ?? (DefaultMail as any))
			const props = {
				brandColor: globalOptions?.template?.brandColor ?? '#5B68DF',
				...mailOptions.templateProps,
			}

			mailOptions.text = render({ template, props, options: { plainText: true, pretty: true } })
			mailOptions.html = render({ template, props, options: { plainText: false, pretty: true } })
		}

		const info = await transporter.sendMail({
			...mailOptions,
			...{ from: mailOptions.from ?? globalOptions?.from },
		})
		if (!globalOptions?.transport) {
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
		} else {
			mailModule.log.success(
				`${magenta(`[${topic}]`)} - Sent to ${typeof mailOptions.to === 'string' ? green(mailOptions.to) : mailOptions.to}`,
			)
		}
		return info
	} catch (error) {
		mailModule.log.error(`${magenta(`[${topic}]`)} - Error`, error)
	}
}

const mailModule = new Module({
	name: 'mail',
	priority: -888,
})

export const mail: (o?: MailOptions<SvelteComponent>) => Module = (o) => {
	mailModule.initApi = () => {
		initMail(o)
	}
	mailModule.initRequest = async () => {
		remult.context.sendMail = sendMail
	}
	return mailModule
}
