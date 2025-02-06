import { Fields, InMemoryDataProvider } from 'remult'

import { FF_Entity } from '$lib'
import { firstly } from '$lib/api'
import { FFAuthUser } from '$lib/auth'
import { auth } from '$lib/auth/server'

// import { github } from '$lib/auth/providers'

const Role = {
  ADMIN: 'admin',
}

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

// const t: DynamicAuthorizationURLOptions<typeof oAuths> = { github: {} }

export const remultApi = firstly({
  dataProvider: process.env.CI ? new InMemoryDataProvider() : undefined,
  mail: {
    template: {
      // component: MyCustomThing
      brandColor: '#E10098',
    },
  },

  modules: [
    {
      name: 'init',
      handlePreRemult: async (h) => {
        h.event.setHeaders({ 'x-remult': 'hello' })
        return await h.resolve(h.event)
      },
      earlyReturn: async () => {
        return {
          early: false,
        }
        // return h.resolve(h.event)
      },
    },
    auth({
      sessionExpiresInMs: 1000 * 30,
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
      },
      debug: true,
      providers: {
        demo: [{ name: 'Noam' }, { name: 'Ermin' }, { name: 'JYC', roles: [Role.ADMIN] }],

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
          //   authorizationURLOptions: { scopes: ['user:email'] },
          //   log: true,
          // }),
        ],
      },
    }),
    {
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
      handlePreRemult: async (h) => {
        return h.resolve(h.event)
      },
    },
  ],
})
