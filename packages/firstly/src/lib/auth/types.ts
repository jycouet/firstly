export type RemultKitData = {
  module: 'auth'
  props: RemultKitDataAuth
}

export type RemultKitDataAuth = {
  ui: {
    paths: {
      base: string
    }
    providers: {
      password: {
        dico: {
          email: string
          email_placeholder: string
          password: string
          btn_sign_in: string
          btn_sign_up: string
          forgot_password: string
          send_password_reset_instructions: string
          back_to_sign_in: string
        }
        paths: {
          sign_up: string | false
          sign_in?: string
          forgot_password?: string
          reset_password?: string
          verify_email?: string
        }
      }
      oAuths: string[]
    }
  }
}
