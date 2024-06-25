export type RemultKitData = {
  module: 'auth'
  props: RemultKitDataKind['auth']
}

export type RemultKitDataKind = {
  auth: {
    providers: string[]
    paths: {
      base: string
      //
      sign_in: string
      forgot_password: string
    }
  }
}

// paths?: {
//   base?: string
//   login?: string
//   forgotPassword?: string
//   // forgotPassword?: string
//   // resetPassword?: string
//   // verifyEmail?: string
//   // profile?: string
// }
