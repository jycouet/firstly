import { createHash, randomBytes, randomInt } from 'node:crypto'

export function newRawToken(prefix: string): string {
	return prefix + randomBytes(32).toString('base64url')
}

export function hashToken(raw: string): string {
	return createHash('sha256').update(raw).digest('hex')
}

export function tokenHint(raw: string, prefix: string): string {
	return raw.slice(0, prefix.length + 8)
}

const ADJECTIVES =
	'amber bold brave calm clever cosmic crisp eager fuzzy gentle happy jolly keen lucky mellow neat nimble plucky quiet rapid rusty shiny silent sly snappy sunny swift tidy vivid witty zesty'.split(
		' ',
	)
const ANIMALS =
	'otter badger falcon heron ibex lynx marmot narwhal ocelot panda quokka raven seal tapir urchin viper walrus yak zebu gecko koala llama mantis newt puffin stoat toucan vole wombat'.split(
		' ',
	)

/** `swift-otter-3f9`: a name you can say out loud when asking "who is running this query?". */
export function randomTokenName(): string {
	const pick = <T>(xs: T[]) => xs[randomInt(xs.length)]
	return `${pick(ADJECTIVES)}-${pick(ANIMALS)}-${randomBytes(2).toString('hex').slice(0, 3)}`
}
