export type RemultKitData = {
  module: 'auth'
  props: RemultKitDataKind['auth']
}

export type RemultKitDataKind = {
  auth: {
    providers: string[]
    paths: {
      base: string
      login: string
      forgottenPassword: string
    }
  }
}
