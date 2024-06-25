import type * as typeNodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'

import { Log, magenta } from '@kitql/helpers'

export type MailOptions = {
  from?: Mail.Options['from']
  transport?: Parameters<typeof typeNodemailer.createTransport>[0]
  apiUrl?: Parameters<typeof typeNodemailer.createTestAccount>[0]
}

let transporter: ReturnType<typeof typeNodemailer.createTransport>
let options: MailOptions | undefined

export const mailInit: (nodemailer: typeof typeNodemailer, o?: MailOptions) => void = (
  nodemailer,
  o,
) => {
  options = o
  if (o?.transport) {
    transporter = nodemailer.createTransport(o?.transport)
  } else {
    nodemailer.createTestAccount(options?.apiUrl ?? '', (err, account) => {
      options = { ...options, from: account.user }

      transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      })
    })
  }
}

const log = new Log('remult-kit | mail')

export const sendMail: (
  topic: string,
  mailOptions: Parameters<typeof transporter.sendMail>[0],
) => ReturnType<typeof transporter.sendMail> = async (topic, mailOptions) => {
  try {
    const info = await transporter.sendMail({
      ...mailOptions,
      ...{ from: mailOptions.from ?? options?.from },
    })

    if (!options?.transport) {
      // @ts-ignore
      log.info(`${magenta(`[${topic}]`)} - Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
    } else {
      log.success(`${magenta(`[${topic}]`)} - Sent to ${mailOptions.to}`)
    }
    return info
  } catch (error) {
    log.error(`${magenta(`[${topic}]`)} - Error`, error)
  }
}
