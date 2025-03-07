import { Fields } from 'remult'

import { FF_Entity, FF_Role } from '$lib'
import { firstly, Module } from '$lib/api'
import { FF_Role_Auth, FFAuthUser } from '$lib/auth'
import { auth } from '$lib/auth/server'
import { mail } from '$lib/mail/server'
import { sveltekit } from '$lib/sveltekit/server'

const Role = {
	...FF_Role,
	...FF_Role_Auth,
	Admin: 'admin',
} as const

@FF_Entity<_AppUser>('app_users', {
	dbName: 'app_users',
	// this overrides the default CRUD... So be carefull !
	// allowApiCrud: true,
	saved(e) {
		console.info(`Yop ${e.identifier} 👋`)
	},
})
export class _AppUser extends FFAuthUser {
	@Fields.string()
	jobTitle: string = 'CEO'
}

export const api = firstly({
	modules: [
		sveltekit(),

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
			debug: true,
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
	],
})
