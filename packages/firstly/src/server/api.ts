import { Fields } from 'remult'

import { task } from '$modules/task/server'
import { FF_Entity, FF_Role } from '$lib'
import { FF_Role_Auth, FFAuthUser } from '$lib/auth'
import { auth } from '$lib/auth/server'
import { mail } from '$lib/mail/server'
import { firstly, Module } from '$lib/server'
import { _AppUser } from '$modules/user/AppUser'

const Role = {
	...FF_Role,
	...FF_Role_Auth,
	Admin: 'admin',
} as const



export const api = firstly({
	modules: [
		mail({
			template: {
				brandColor: '#E10098',
			},
		}),

		auth({
			session: {
				// expiresIn: 1000 * 30,
				COOKIE_NAME: 'my_fancy_cookie_name',
			},
			uiStaticPath: './src/lib/auth/static/',
			customEntities: {
				User: _AppUser,
			},

			transformDbUserToClientUser(session, user) {
				return {
					id: user.id,
					name: user.identifier,
					roles: user.roles,
					session: {
						id: session.id,
						expiresAt: session.expiresAt,
					},
					theme: user.theme ?? "daisy",
				}
			},
			// ui: {
			//   strings: {
			//     email_placeholder: 'Yes ?',
			//   },
			// },

			// signUp: false,

			verifiedMethod: 'email',

			ui: {
				paths: {
					// sign_in: false,
				},
				strings: {
					app_name: 'Hello you',
				},
				images: {
					// main: 'https://placehold.co/600x400',
					main:
						'https://images.unsplash.com/photo-1588421357937-c6dadca810cf?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
				},
			},
			// debug: true,
			providers: {
				demo: [
					{ name: 'Noam' },
					{ name: 'Ermin' },
					{ name: 'JYC', roles: [Role.Admin, Role.FF_Role_Admin] },
				],

				password: {
					//   verifyMailSend: async () => {},
				},

				otp: {
					send: async (data) => {
						console.info(`OTP to send`, JSON.stringify(data, null, 2))
					},
				},

				oAuths: [
					// github({
					//   authorizationURLOptions: ['user:email'],
					//   log: true,
					// }),
				],
			},
		}),

		new Module({
			name: 'theEnd',
			async initApi() {
				// await sendMail('my_first_mail', {
				//   to: 'jycouet@gmail.com',
				//   subject: 'Hello from firstly',
				//   templateProps: {
				//     title: 'firstly 👋',
				//     previewText: 'This is the mail you were waiting for',
				//     sections: [
				//       {
				//         text: 'Then, How are you today ?',
				//         highlighted: true,
				//       },
				//       {
				//         text: 'Did you star the repo ?',
				//         cta: { text: 'Check it out', link: 'https://github.com/jycouet/firstly' },
				//       },
				//     ],
				//   },
				// })
			},
			// handlePreRemult: async (h) => {
			//   return h.resolve(h.event)
			// },
		}),

		task({ specialInfo: 'Hello from the server' }),
	],
})
