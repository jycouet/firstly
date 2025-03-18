import * as p from '@clack/prompts'

import { bold, cyan, gray, green, italic, Log } from '@kitql/helpers'
import { read, write } from '@kitql/internals'

// Need this trick to be be replaced by the real lib alias here ;)
const libAlias = '$' + 'lib'
const serverAlias = '$' + 'server'
const modulesAlias = '$' + 'modules'

const pkgFirstly = JSON.parse(read('./node_modules/firstly/package.json') ?? '{}')
const versionOfRemult = pkgFirstly?.peerDependencies?.['remult'] ?? 'latest'

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
		hint:
			'A default module with a task entity and a controller (you can rename the folder and make it yours)',
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
	'@kitql/eslint-config': '0.6.0',
	'@kitql/helpers': '0.8.12',
	pg: '8.12.0',
	remult: versionOfRemult,
})

pkg.dependencies = mergeAndSort(pkg.dependencies, {})

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
	// Configs
	'./.npmrc': [
		`engine-strict=true

public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
public-hoist-pattern[]=*globals*
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
	'./eslint.config.js': [
		`import { kitql } from '@kitql/eslint-config'

/** @type { import("eslint").Linter.Config[] } */
export default [
	...kitql({ pnpmCatalogs: { enable: false } }),
	{
		name: 'APP:ignores',
		ignores: ['**/*.svelte.ts'],
	},
]
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
	'./.prettierrc.mjs': [
		`import { kitql } from '@kitql/eslint-config/.prettierrc.mjs'

export default {
	...kitql(),
  // Your overrides here
}
`,
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
    // @ts-ignore JYC TODO (vite 5 / vite 6...)
    firstly<KIT_ROUTES>({
      kitRoutes: {
        LINKS: { 
          login: 'ff/auth/sign-in',
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
	'./svelte.config.js': [
		`import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
    alias: {
			$modules: './src/modules',
			$server: './src/server',
		},
	},
}

export default config
`,
	],

	// App files
	'./src/app.d.ts': [
		`// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module 'remult' {
	export interface UserInfo {
		// Your custom user info
	}

	export interface FieldOptions<entityType, valueType> {
		placeholder?: string
	}
}

export { }
`,
	],
	'./src/server/index.ts': [
		`import { FF_Role } from 'firstly'
import { firstly, Module } from 'firstly/server'
import { auth } from 'firstly/auth/server'
import { mail } from 'firstly/mail/server'
import { changeLog } from 'firstly/changeLog/server'

import { log, Role } from '${libAlias}'
import { task } from '${modulesAlias}/task/server'

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
          { name: 'JYC', roles: [FF_Role.FF_Role_Admin] },
          { name: 'Noam', roles: [FF_Role.FF_Role_Admin, Role.Boss] },
        ],

        // password: {},

        // otp: {},

        oAuths: [
          //----------------------------------------
          // To enable OAuth via Github
          // Instructions by hovering the method \`github\`
          // NEEDS ON TOP OF THE FILE: 
          //   import { github } from 'firstly/auth/server'
          //----------------------------------------
          // github(),
        ],
      },
    }),

    //----------------------------------------
    // Core Module: mail
    //----------------------------------------
    mail({
      // options
    }),

    //----------------------------------------
    // example of a userland module
    //----------------------------------------
    task({ specialInfo: 'hello from userland' }),

    //----------------------------------------
    // example of a userland inline module
    //----------------------------------------
    new Module({
      name: 'app',
      entities: [],
      controllers: [],
      initApi: async () => {
        log.success('App is ready! 🚀')
      },
    }),

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
import { redirect } from '@sveltejs/kit'

import { handleAuth, handleGuard } from 'firstly/auth/server'
import { route } from '${libAlias}/ROUTES'
import { api as handleRemult } from '${serverAlias}'

export const handle = sequence(
	//
	handleRemult,
	handleAuth,
  // client side guard is not here!
	handleGuard({
		authenticated: ['/app*'],
    redirectToLogin: route('/'),
    // You want to redirect to the firstly UI ? change redirectToLogin to this 👇
		// redirectToLogin: route('login'),
		redirectAuthenticated: route('/app'),
		redirect,
	})
)
`,
	],
	'./src/routes/api/[...remult]/+server.ts': [
		`import { api } from '${serverAlias}'

export const { GET, POST, PUT, DELETE } = api
`,
	],
	'./src/routes/+layout.server.ts': [
		`import { remult } from 'remult'

import type { LayoutServerLoad } from './$types'

export const load = (async () => {
  return { user: remult.user }
}) satisfies LayoutServerLoad	
`,
	],
	'./src/routes/+layout.ts': [
		`import { remult } from 'remult'
import type { LayoutLoad } from './$types'

export const load = (async (event) => {
  // Instruct remult to use the special svelte fetch
  // Like this univeral load will work in SSR & CSR
  remult.useFetch(event.fetch)
  // return repo(Task).find()
  return { ...event.data }
}) satisfies LayoutLoad
`,
	],
	'./src/routes/+layout.svelte': [
		`<script lang="ts">
  import { untrack } from 'svelte'
	import { createSubscriber } from 'svelte/reactivity'

	import { Remult, remult } from 'remult'

  import { route } from '${libAlias}/ROUTES'
  import SignIn from '${libAlias}/ui/SignIn.svelte'
  import SignOut from '${libAlias}/ui/SignOut.svelte'

import type { LayoutData } from './$types'

	interface Props {
		data: LayoutData
		children?: import('svelte').Snippet
	}

	let { data, children }: Props = $props()

	$effect(() => {
		// Trigger the effect only on data.user update
		data.user
		untrack(() => {
			remult.user = data.user
		})
	})

	// To be done once in the application.
	function initRemultSvelteReactivity() {
		// Auth reactivity (remult.user, remult.authenticated(), ...)
		{
			let update = () => {}
			let s = createSubscriber((u) => {
				update = u
			})
			remult.subscribeAuth({
				reportObserved: () => s(),
				reportChanged: () => update(),
			})
		}

		// Entities reactivity
		{
			Remult.entityRefInit = (x) => {
				let update = () => {}
				let s = createSubscriber((u) => {
					update = u
				})
				x.subscribe({
					reportObserved: () => s(),
					reportChanged: () => update(),
				})
			}
		}
	}
	initRemultSvelteReactivity()
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
  <br />
  <SignIn oauth="github"></SignIn>
{/if}

<hr />

<a href={route('/')}>Home</a> | 
{#if remult.authenticated()}
  <a href={route('/app')}>App (Protected route)</a> |
{/if}
<a href={route('/demo/task')}>Demo task</a>

<hr />

{@render children?.()}

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
	'./src/routes/+page.ts': [
		`import { remult } from 'remult'
import type { PageLoad } from './$types'

export const load = (async (event) => {
  // Instruct remult to use the special svelte fetch
  // Like this univeral load will work in SSR & CSR
  remult.useFetch(event.fetch)
  // return repo(Task).find()
}) satisfies PageLoad
`,
	],
	'./src/routes/+page.svelte': [
		`<h1>Home</h1>

<p>
    Welcome here
</p>`,
	],
	'./src/routes/app/+page.svelte': [
		`<h1>App</h1>

<p>
    Only autenticated users can see this page!
</p>

`,
	],

	// Lib files
	'./src/lib/index.ts': [
		`import { FF_Role } from 'firstly'
import { FF_Role_Auth } from 'firstly/auth'
import { Log } from '@kitql/helpers'

/**
 * Your logs with a nice prefix, use \`log.info("Hello")\` / \`log.success("Yeah")\` / \`log.error("Ho nooo!")\` and see !
 */
export const log = new Log('${pkg.name}')

/**
 * Your roles, use them in your app !
 */
export const Role = {
	Boss: 'Boss',
	...FF_Role_Auth,
	...FF_Role,
} as const
`,
	],
	'./src/lib/ui/SignIn.svelte': [
		`<script lang="ts">
  import { isError } from 'firstly'
  import { AuthController } from 'firstly/auth'

  import { goto, invalidateAll } from '$app/navigation'

  import { route } from '${libAlias}/ROUTES'

  // Examples of signin modes
  export let demo = ''
  export let ffLink = false
  export let oauth: 'github' | undefined = undefined

  const signinDemo = async (identif: string) => {
    try {
      await AuthController.signInDemo(identif)
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
      window.location.href = await AuthController.signInOAuthGetUrl({
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
  <button on:click={() => goto(route('login'))}>Login with Firstly UI</button>
{:else if oauth}
  <button on:click={() => signinOAuth(oauth)}>Login With {oauth}</button>
{/if}
`,
	],
	'./src/lib/ui/SignOut.svelte': [
		`<script lang="ts">
  import { isError } from 'firstly'
  import { AuthController } from 'firstly/auth'

  import { invalidateAll } from '$app/navigation'

  const logout = async () => {
    try {
      await AuthController.signOut()
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

	// Task module
	'./src/modules/task/index.ts': [
		`import { Log } from '@kitql/helpers'

export const log = new Log("Custom Task Log")`,
	],
	'./src/modules/task/server/index.ts': [
		`import { Module } from 'firstly/server'

import { Task } from '../Task'
import { TaskController } from '../TaskController'

export const task: (o: { specialInfo: string }) => Module = ({ specialInfo }) => {
	const m = new Module({
		name: 'task',
		entities: [Task],
		controllers: [TaskController],
		initApi: async () => {
			m.log.success(\`Task module is ready! 🚀 (specialInfo: \${specialInfo})\`)
		},
	})

	return m
}
`,
	],
	'./src/modules/task/Task.ts': [
		`import { Allow, Entity, Field, Fields, ValueListFieldType } from 'remult'
import { BaseEnum, LibIcon_Add, LibIcon_Delete, type BaseEnumOptions } from 'firstly'

@Entity('task', {
  allowApiCrud: Allow.authenticated,
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
	'./src/modules/task/TaskController.ts': [
		`import { BackendMethod } from 'remult'

import { log } from '${libAlias}'

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
	'./src/modules/task/ui/TaskAdd.svelte': [
		`<script lang="ts">
	import { EntityError, repo } from 'remult'

	import { Task } from '${modulesAlias}/task/Task'

	let task = $state(repo(Task).create())
	let error = $state<EntityError<Task> | null>(null)

	const add = async (e: Event) => {
		e.preventDefault()
    error = null
		try {
			await repo(Task).insert(task)
			task = repo(Task).create()
		} catch (e) {
			if (e instanceof EntityError) {
				error = e
			}
		}
	}
</script>

<form onsubmit={add}>
	<p>
		{error?.modelState?.title}
	</p>
	<label for={repo(Task).fields.title.key}>{repo(Task).fields.title.caption}</label>
	<input id={repo(Task).fields.title.key} type="text" bind:value={task.title} />
	<button disabled={!repo(Task).metadata.apiInsertAllowed()}>Add</button>
</form>
`,
	],
	'./src/modules/task/ui/TaskList.svelte': [
		`<script lang="ts">
	import { repo } from 'remult'

	import { Task } from '${modulesAlias}/task/Task'

	let list: Task[] = $state([])

	$effect(() => {
		if (repo(Task).metadata.apiReadAllowed) {
			return repo(Task)
				.liveQuery()
				.subscribe((info) => {
					list = info.applyChanges(list)
				})
		}
	})
</script>

{#if repo(Task).metadata.apiReadAllowed}
	<ul>
		{#each list as task (task.id)}
			<li>{task.title}</li>
		{/each}
	</ul>
{:else}
	<p>Login to see the task list!</p>
{/if}
`,
	],
	'./src/routes/demo/task/+page.svelte': [
		`<script lang="ts">
	import TaskAdd from '${modulesAlias}/task/ui/TaskAdd.svelte'
	import TaskList from '${modulesAlias}/task/ui/TaskList.svelte'
</script>

<h1>Task Module</h1>

<TaskAdd />
<TaskList />
`,
	],
}

for (const [path, content] of Object.entries(obj)) {
	if (res.includes('all')) {
		write(path, content)
	} else {
		if (res.includes('module-demo')) {
			if (path.startsWith('./src/modules/task')) {
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
