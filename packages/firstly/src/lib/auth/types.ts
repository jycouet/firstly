export type firstlyData = {
  module: 'auth'
  debug?: boolean
  props: firstlyDataAuth
}

export type firstlyDataAuth = {
  ui?: {
    paths: {
      base: string
      sign_up: string
      sign_in: string
      forgot_password: string
      reset_password: string
      verify_email: string
    }
    strings: {
      email: string
      email_placeholder: string
      password: string
      btn_sign_in: string
      btn_sign_up: string
      forgot_password: string
      send_password_reset_instructions: string
      back_to_sign_in: string
    }
  }
}
