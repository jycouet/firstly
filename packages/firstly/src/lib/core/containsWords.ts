import type { EntityFilter, FieldMetadata } from 'remult'

/**
 * Builds a filter where every word in `search` must match (AND), and each word
 * may match any of the given fields (OR), using case-insensitive `$contains`.
 *
 * E.g. "dupont marie" over [name, sesa] =>
 *   (name~dupont OR sesa~dupont) AND (name~marie OR sesa~marie)
 *
 * So word order and which field holds which word don't matter - handy for
 * "NOM Prénom" style search across several columns. Pairs with `ffRepo`:
 * `ffRepo(User).find(() => ({ where: containsWords([f.name, f.sesa], q) }))`.
 */
export const containsWords = <Entity>(
	fields: FieldMetadata<unknown, Entity>[],
	search: string,
): EntityFilter<Entity> => {
	const words = (search ?? '').split(' ').filter((s) => s.length > 0)
	if (words.length === 0 || fields.length === 0) {
		return {}
	}

	if (fields.length === 1) {
		return {
			$and: words.map((s) => ({ [fields[0].key]: { $contains: s } })),
		} as EntityFilter<Entity>
	}

	return {
		$and: words.map((s) => ({
			$or: fields.map((f) => ({ [f.key]: { $contains: s } })),
		})),
	} as EntityFilter<Entity>
}
