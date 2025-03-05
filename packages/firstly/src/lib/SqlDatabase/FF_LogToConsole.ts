import { SqlDatabase } from 'remult'
import { bgCyan, cyan, green, Log, magenta, yellow } from '@kitql/helpers'

const typeQuery = new Map<string, string>([
  // CRUD
  ['INSERT', '⚪'], // Used to insert new data into a database.
  ['SELECT', '🔵'], // Used to select data from a database and retrieve it.
  ['COUNT ', '🟦'], // Used to count data from a database and retrieve it.
  ['UPDATE', '🟣'], // Used to update existing data within a database.
  ['DELETE', '🟤'], // Used to delete existing data from a database.
  // Additional
  ['CREATE', '🟩'], // Used to create a new table, or database.
  ['ALTER', '🟨'], // Used to modify an existing database object, such as a table.
  ['DROP', '🟥'], // Used to delete an entire table or database.
  ['TRUNCATE', '⬛'], // Used to remove all records from a table, including all spaces allocated for the records are removed.
  ['GRANT', '🟪'], // Used to give a specific user permission to perform certain tasks.
  ['REVOKE', '🟫'], // Used to take back permissions from a user.
])

const keys = ['FROM', 'WHERE', 'LIMIT', 'OFFSET']
const typeQueryKey = Array.from(typeQuery.keys())

const log = new Log('')

export const FF_LogToConsole = (
  duration: number,
  query: string,
  args: Record<string, any>,
  options?: {
    withDetails?: boolean
    tablesToHide?: string[][]
    ending?: (duration: number, query: string, args: Record<string, any>, tables: string[]) => void
  },
) => {
  if (duration < SqlDatabase.durationThreshold) return

  const rawSql = query
    .replace(/(\r\n|\n|\r|\t)/gm, ' ')
    .replace(/  +/g, ' ')
    .trim()
  const s = rawSql.split(' ')

  let first = s[0].toUpperCase()
  if (s.includes('count(*)')) {
    first = 'COUNT '
  }

  const tables: string[] = []
  const listArgs = []
  for (let i = 0; i < s.length; i++) {
    const up = s[i].toUpperCase()

    if (keys.includes(up)) {
      s[i] = magenta(up)
    } else if (typeQueryKey.includes(up)) {
      s[i] = cyan(up)
    }

    if (up === 'FROM') {
      tables.push(s[i + 1]) // let's do it before color
      s[i + 1] = green(s[i + 1])
    } else if (up === 'INSERT') {
      tables.push(s[i + 2]) // let's do it before color
    } else if (up === 'UPDATE') {
      tables.push(s[i + 1]) // let's do it before color
    } else if (up === 'LIMIT') {
      s[i + 1] = yellow(s[i + 1])
    } else if (up === 'OFFSET') {
      s[i + 1] = yellow(s[i + 1])
    } else if (up === 'ORDER' && s[i + 1].toUpperCase() === 'BY') {
      s[i] = magenta('ORDER')
      s[i + 1] = magenta('BY')
    }

    const regex = /\$\d+/g

    const matches = s[i].match(regex)
    if (matches && matches.length > 0) {
      // and it's a match with [$ somthing]

      // let newMatches = s[i]
      matches.reverse().forEach((keys) => {
        s[i] = s[i].replace(keys, yellow("'" + args[keys] + "'"))
      })
      listArgs.push(s[i - 2].replaceAll('"', '') + ': ' + s[i])
    }
  }

  const toFilterOut = options?.tablesToHide ?? [
    ['information_Schema.tables'],
    ['information_schema.columns'],
    // ['__remult_migrations_version'],
    ['ff_auth.accounts'],
    ['ff_auth.users'],
    ['ff_auth.users_sessions'],
    ['_ff_change_logs'],
  ]
  const toHide = toFilterOut.some((item) =>
    item.every((i) => tables.map((c) => c.replaceAll('"', '')).includes(i)),
  )

  if (toHide) return

  const final_s = s.join(' ').replace(/  +/g, ' ')
  // args replace
  // const listArgs = []
  // for (const arg in args) {
  // 	listArgs.push(yellow(args[arg]))
  // 	final_s = final_s.replace(arg, yellow(args[arg]))
  // }

  const uniqueTables = [...new Set(tables)]
  const mainTable = uniqueTables[uniqueTables.length - 1]
  const subTables = uniqueTables.slice(0, -1)

  const time = ` ${bgCyan((duration * 1000).toFixed(0).padStart(3) + ' ms ')}`

  let toLog = ''
  const withDetails = options?.withDetails === undefined ? true : options?.withDetails
  if (withDetails) {
    toLog = `${typeQuery.get(first) || '💢'}` + time + ` ${final_s}`
  } else {
    toLog =
      `${typeQuery.get(first) || '💢'}` +
      `${time}` +
      ` ${cyan(first)} ${green(mainTable?.replaceAll('"', ''))}` +
      `${listArgs.length > 0 ? ` { ${listArgs.join(', ')} }` : ``}` +
      `${subTables.length > 0 ? magenta(` (sub: ${subTables.join(', ')})`) : ``}`
  }

  log.info(toLog)

  if (options?.ending) {
    options.ending(duration, query, args, tables)
  }
  return toLog
}
