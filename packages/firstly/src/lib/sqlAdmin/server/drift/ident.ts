/** pg catalog / metadata names can come back quoted or schema-qualified. */
export const stripIdent = (name: string) => name.replaceAll('"', '').split('.').pop()!
