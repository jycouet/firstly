import './app.css'

import App from './App.svelte'

// if remult kit data not defined, use mock data
// @ts-expect-error
if (typeof remultKitData === 'undefined') {
  // @ts-expect-error
  window.remultKitData = {
    module: 'auth',
    props: {
      strings: {
        'auth.login': 'Login',
        'auth.signUp': 'Sign up',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.confirmPassword': 'Confirm password',
        'auth.rememberMe': 'Remember me',
        'auth.forgotPassword': 'Forgot password?',
      },
      providers: [
        {
          id: 'github',
          name: 'GitHub',
        },
        {
          id: 'google',
          name: 'Google',
        },
      ],
    },
  }
}

const app = new App({
  // @ts-expect-error
  target: document.getElementById('app'),
  props: {
    // @ts-expect-error
    remultKitData: remultKitData,
  },
})

export default app
