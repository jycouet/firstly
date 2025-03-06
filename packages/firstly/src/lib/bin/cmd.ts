import * as p from '@clack/prompts'

import { bold, cyan, gray, green, italic, Log } from '@kitql/helpers'
import { read, write } from '@kitql/internals'

// Need this trick to be be replaced by the real lib alias here ;)
const libAlias = '$' + 'lib'

const pkgFirstly = JSON.parse(read('./node_modules/firstly/package.json') ?? '{}')
const versionFirstly = pkgFirstly?.peerDependencies?.['remult'] ?? 'latest'

const pkg = JSON.parse(read('./package.json') ?? '{}')
const version = pkg.devDependencies?.['firstly'] ?? pkg.dependencies?.['firstly'] ?? '???'

console.info('')
p.intro(`${green(`⚡️`)} Welcome to firstly world! ${gray(` - v${version}`)}`)

const keys = ['all', 'module-demo', 'dependencies'] as const

type Keys = (typeof keys)[number]
const options: { value: Keys; label: string; hint?: string | undefined }[] = [
  {
    value: 'all',
    label: 'All',
    hint: 'If you are starting a new project, this is for you!',
  },
  {
    value: 'module-demo',
    label: 'module task',
    hint: 'A default module with a task entity and a controller (you can rename the folder and make it yours)',
  },
  {
    value: 'dependencies',
    label: 'dependencies',
    hint: 'Add all dependencies that make sense to use with firstly',
  },
]

const res = (await p.multiselect({
  message: 'You can generate different things here',
  options,
})) as Keys[]

// devDependencies
function mergeAndSort(
  deps: Record<string, string>,
  depsToAdd: Record<string, string>,
): Record<string, string> {
  const prepare: Record<string, string> = {
    ...depsToAdd,
    ...deps,
  }

  // sort by name
  const sorted = Object.keys(prepare)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = prepare[key]
        return acc
      },
      {} as Record<string, string>,
    )

  return sorted
}

pkg.devDependencies = mergeAndSort(pkg.devDependencies, {
  '@kitql/eslint-config': '0.5.4',
  '@kitql/helpers': '0.8.12',
  pg: '8.12.0',
  remult: versionFirstly,
})

pkg.dependencies = mergeAndSort(pkg.dependencies, {
  oslo: '^1.2.1',
})

pkg.scripts = {
  ...pkg.scripts,
  '//// ---- BEST PRACTICES ---- ////': '',
  lint: 'kitql-lint',
  format: 'kitql-lint -f',
}
if (res.includes('all') || res.includes('dependencies')) {
  write('./package.json', [JSON.stringify(pkg, null, 2)])
}

const obj = {
  './.eslintrc.cjs': [
    `module.exports = {
  extends: ['@kitql'],
  rules: {
    // Your overrides here
  }
}
  `,
  ],
  './.prettierignore': [
    `node_modules/
dist/
build
.vs
.vscode
.bob/
.next/
.idea/
.svelte-kit/
.husky/_/
.changeset/
.DS_Store
coverage/
package.json
pnpm-lock.yaml
README.md

db/
src/lib/ROUTES.ts
  `,
  ],
  './.prettierrc.cjs': [
    `const {
  //plugins,
  ...prettierConfig
} = require('@kitql/eslint-config/.prettierrc.cjs')

module.exports = {
  ...prettierConfig,
  // Your overrides here
}`,
  ],
  '.env.example': [
    `# Enable some roles
# FF_ADMIN = 'JYC'
# FF_AUTH_ADMIN = ''

# Enable GitHub login
# GITHUB_CLIENT_ID = ''
# GITHUB_CLIENT_SECRET = ''
`,
  ],
  './src/lib/firstly/index.ts': [
    `import { FF_Role } from 'firstly'
import { firstly } from 'firstly/api'
import { auth } from 'firstly/auth'
import { changeLog } from 'firstly/changeLog'
import { Log } from '@kitql/helpers'

import { task } from './modules/task'

/**
 * Your roles, use them in your app !
 */
export const Role = {
  Boss: 'Boss',
}

/**
 * Your logs with a nice prefix, use \`log.info("Hello")\` / \`log.success("Yeah")\` / \`log.error("Ho nooo!")\` and see !
 */
export const log = new Log('${pkg.name}')

export const api = firstly({
  //----------------------------------------
  // To switch to postgres
  // NEEDS ON TOP OF THE FILE: 
  //   import { createPostgresConnection } from 'remult/postgres'
  //   import { DATABASE_URL } from '$env/static/private'
  //----------------------------------------
  // dataProvider: await createPostgresConnection({
  //  connectionString: DATABASE_URL,
  // }),

  modules: [
    //----------------------------------------
    // Core Module: auth
    //----------------------------------------
    auth({
      providers: {
        demo: [
          { name: 'Ermin' },
          { name: 'JYC', roles: [FF_Role.Admin] },
          { name: 'Noam', roles: [FF_Role.Admin, Role.Boss] },
        ],

        // password: {},

        // otp: {},

        oAuths: [
          //----------------------------------------
          // To enable OAuth via Github
          // Instructions by hovering the method \`github\`
          // NEEDS ON TOP OF THE FILE: 
          //   import { github } from 'firstly/auth/providers'
          //----------------------------------------
          // github(),
        ],
      },
    }),

    //----------------------------------------
    // example of a userland module
    //----------------------------------------
    task({ specialInfo: 'hello from userland' }),

    //----------------------------------------
    // example of a userland inline module
    //----------------------------------------
    {
      name: 'app',
      entities: [],
      controllers: [],
      initApi: async () => {
        log.success('App is ready! 🚀')
      },
    },

    //----------------------------------------
    // Replace @Entity by @FF_Entity in your entities to enable changeLog on this entity
    //----------------------------------------
    changeLog(),
  ],
})
`,
  ],
  './src/hooks.server.ts': [
    `import { sequence } from '@sveltejs/kit/hooks'

import { firstly } from 'firstly/handle'

import { api } from '${libAlias}/firstly'

export const handle = sequence(firstly(api))
`,
  ],
  './src/routes/api/[...remult]/+server.ts': [
    `import { api } from '${libAlias}/firstly'

export const { GET, POST, PUT, DELETE } = api
`,
  ],
  './src/routes/+page.svelte': [`Home 👋`, ``],
  './src/routes/+layout.server.ts': [
    `import { remult } from 'remult'

import type { LayoutServerLoad } from './$types'

export const load = (async () => {
  return { user: remult.user }
}) satisfies LayoutServerLoad	
`,
  ],
  './src/routes/+layout.svelte': [
    `<script lang="ts">
  import { remult } from 'remult'

  import { route } from '${libAlias}/ROUTES'
  import SignIn from '${libAlias}/ui/SignIn.svelte'
  import SignOut from '${libAlias}/ui/SignOut.svelte'

  import type { LayoutData } from './$types'

  export let data: LayoutData
  $: remult.user = data.user
</script>

<svelte:head>
  <title>${pkg.name}</title>
  <link
    rel="icon"
    href="https://raw.githubusercontent.com/jycouet/firstly/main/assets/firstly.png"
  />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/dark.css" />
</svelte:head>

<h1>${pkg.name}</h1>

{#if remult.authenticated()}
  <div style="float:right;">
    <SignOut></SignOut>
  </div>
  <span>{remult.user?.name} ({remult.user?.roles})<br /><br /></span>
{:else}
  <SignIn demo="Ermin"></SignIn>
  <SignIn demo="JYC"></SignIn>
  <SignIn demo="Noam"></SignIn>
  <br />
  <SignIn ffLink></SignIn>
  <SignIn oauth="github"></SignIn>
{/if}

<hr />

<slot />

<hr />

<div style="float: right; text-align: right;">
  <a href={route('remult_admin')} target="_blank">🚀 admin</a>
  <p style="font-size: small;">
    <i>Login as <b>JYC</b> to get admin rights ☝️</i>
  </p>
</div>
<a href={route('github', { owner: 'jycouet', repo: 'firstly' })} target="_blank"> ⭐️ firstly </a>
|
<a href={route('github', { owner: 'remult', repo: 'remult' })} target="_blank">⭐️ remult</a>
`,
  ],
  './src/lib/ui/SignIn.svelte': [
    `<script lang="ts">
  import { isError } from 'firstly'
  import { Auth } from 'firstly/auth/client'

  import { goto, invalidateAll } from '$app/navigation'

  import { route } from '$lib/ROUTES'

  // Examples of signin modes
  export let demo = ''
  export let ffLink = false
  export let oauth: 'github' | undefined = undefined

  const signinDemo = async (identif: string) => {
    try {
      await Auth.signInDemo(identif)
      invalidateAll()
    } catch (error) {
      if (isError(error)) {
        // You will probably not leave this alert in production
        alert(error.message)
      }
    }
  }

  async function signinOAuth(provider: 'github') {
    try {
      window.location.href = await Auth.signInOAuthGetUrl({
        provider,
        redirect: window.location.pathname,
      })
    } catch (error) {
      if (isError(error)) {
        // You will probably not leave this alert in production
        alert(error.message)
      }
    }
  }
</script>

{#if demo}
  <button on:click={() => signinDemo(demo)}>Login as {demo}</button>
{:else if ffLink}
  <button on:click={() => goto(route('firstly_sign_in'))}>Login with Firstly</button>
{:else if oauth}
  <button on:click={() => signinOAuth(oauth)}>Login With {oauth}</button>
{/if}
`,
  ],
  './src/lib/ui/SignOut.svelte': [
    `<script lang="ts">
  import { isError } from 'firstly'
  import { Auth } from 'firstly/auth/client'

  import { invalidateAll } from '$app/navigation'

  const logout = async () => {
    try {
      await Auth.signOut()
      invalidateAll()
    } catch (error) {
      if (isError(error)) {
        alert(error.message)
      }
    }
  }
</script>

<button on:click={logout}>Logout</button>
`,
  ],
  './tsconfig.json': [
    `{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "experimentalDecorators": true,
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler"
  }
  // Path aliases are handled by https://kit.svelte.dev/docs/configuration#alias
  //
  // If you want to overwrite includes/excludes, make sure to copy over the relevant includes/excludes
  // from the referenced tsconfig.json - TypeScript does not merge them in
}
`,
  ],
  './vite.config.ts': [
    `import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

import { firstly } from 'firstly/vite'

import type { KIT_ROUTES } from '${libAlias}/ROUTES'

export default defineConfig({
  plugins: [
    firstly<KIT_ROUTES>({
      kitRoutes: {
        LINKS: { 
          firstly_sign_in: 'ff/auth/sign-in',
          github: 'https://github.com/[owner]/[repo]',
          remult_admin: 'api/admin',
        },
      }
    }),
    sveltekit(),
  ],
})
`,
  ],
  './.gitignore': [
    `node_modules

# Output
/.svelte-kit
/build

# Env
.env
.env.*
!.env.example
!.env.test

# Vite
vite.config.js.timestamp-*
vite.config.ts.timestamp-*

# Firstly / Remult
/db
`,
  ],
  './src/lib/firstly/modules/task/index.ts': [
    `import type { Module } from 'firstly/api'

import { log } from '${libAlias}/firstly'

import { Task } from './Task'
import { TaskController } from './TaskController'

export const task: (o: { specialInfo: string }) => Module = ({ specialInfo }) => {
  return {
    name: 'task',
    entities: [Task],
    controllers: [TaskController],
    initApi: async () => {
      log.success(\`Task module is ready! 🚀 (specialInfo: \${specialInfo})\`)
    },
  }
}`,
  ],
  './src/lib/firstly/modules/task/Task.ts': [
    `import { Entity, Field, Fields, ValueListFieldType } from 'remult'
import { BaseEnum, LibIcon_Add, LibIcon_Delete, type BaseEnumOptions } from 'firstly'

@Entity('task', {
  allowApiCrud: true,
})
export class Task {
  @Fields.cuid()
  id!: string

  @Fields.createdAt()
  createdAt?: Date

  @Fields.string<Task>({
    validate: (task) => {
      if (task.title.length < 3) throw 'The title must be at least 3 characters long'
    },
  })
  title: string = ''

  @Fields.boolean()
  completed: boolean = false

  @Field(() => TypeOfTaskEnum, { inputType: 'selectEnum' })
  typeOfTask = TypeOfTaskEnum.EASY
}

@ValueListFieldType()
export class TypeOfTaskEnum extends BaseEnum {
  static EASY = new TypeOfTaskEnum('EASY', {
    caption: 'Easy',
    icon: { data: LibIcon_Add },
  })
  static HARD = new TypeOfTaskEnum('HARD', {
    caption: 'Hard',
    icon: { data: LibIcon_Delete },
  })
  constructor(id: string, o?: BaseEnumOptions<TypeOfTaskEnum>) {
    super(id, o)
  }
}    
`,
  ],
  './src/lib/firstly/modules/task/TaskController.ts': [
    `import { BackendMethod } from 'remult'

import { log } from '${libAlias}/firstly'

/**
 * await TaskController.sayHiFromTask("JYC")
 */
export class TaskController {
  @BackendMethod({ allowed: true })
  static async sayHiFromTask(name: string) {
    log.info(\`hello \${name} 👋\`)
  }
}
`,
  ],
}

for (const [path, content] of Object.entries(obj)) {
  if (res.includes('all')) {
    write(path, content)
  } else {
    if (res.includes('module-demo')) {
      if (path.startsWith('./src/lib/firstly/modules/task')) {
        write(path, content)
      }
    }
  }
}

p.outro(`🎉 Everything is ok, happy coding!`)

new Log('').info(
  gray(
    italic(
      `${bold('❔ More help')} ` +
        `at ${cyan('https://github.com/jycouet/firstly')} ` +
        `(📄 Docs, ⭐ Github, 📣 Discord, ...)\n`,
    ),
  ),
)
