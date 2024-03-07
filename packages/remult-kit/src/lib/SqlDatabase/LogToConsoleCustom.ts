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

export const LogToConsoleCustom = (
	duration: number,
	query: string,
	args: Record<string, any>,
	short: boolean = true,
) => {
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
			const keyMatched = matches[0]
			if (args[keyMatched]) {
				s[i] = yellow(args[keyMatched])

				if (first === 'INSERT') {
					listArgs.push(s[i])
				} else {
					listArgs.push(s[i - 2].replaceAll('"', '') + ': ' + s[i])
				}
			}
		}
		// console.log(`matches`, matches)
	}

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

	const toLogShort =
		`${typeQuery.get(first) || '💢'}` +
		`${time}` +
		` ${cyan(first)} ${green(mainTable?.replaceAll('"', ''))}` +
		`${listArgs.length > 0 ? ` { ${listArgs.join(', ')} }` : ``}` +
		`${subTables.length > 0 ? magenta(` (sub: ${subTables.join(', ')})`) : ``}`

	const toLogLong = `${typeQuery.get(first) || '💢'}` + time + ` ${final_s}`

	const toLog = short ? toLogShort : toLogLong

	// Filter out a few things
	const filterOutTable = ['"auth_user"', '"auth_user_session"']
	const OnoOfFiltered = tables.length === 1 && filterOutTable.includes(tables[0])

	if (!OnoOfFiltered) {
		// console.log(`toLogLong`, toLogLong)

		log.info(toLog)
		return toLog
	}
}

const log = new Log('')
