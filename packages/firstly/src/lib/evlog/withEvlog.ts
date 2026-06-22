import {
	getEntityRef,
	IdEntity,
	isBackend,
	type EntityOptions,
	type FieldRef,
	type FieldsRef,
	type LifecycleEvent,
} from 'remult'

export interface EvlogColumnDeciderArgs<entityType> {
	module?: string
	excludeColumns?: (e: FieldsRef<entityType>) => FieldRef<entityType, any>[]
	excludeValues?: (e: FieldsRef<entityType>) => FieldRef<entityType, any>[]
}

export class FieldDecider<entityType> {
	fields: FieldRef<entityType>[]
	excludedFields: FieldRef<entityType>[]
	excludedValues: FieldRef<entityType>[]
	constructor(entity: entityType, options?: EvlogColumnDeciderArgs<entityType>) {
		const meta = getEntityRef(entity)
		// @ts-ignore - mirror changeLog FieldDecider
		this.excludedFields = options?.excludeColumns ? options.excludeColumns(meta.fields) : []
		// @ts-ignore
		this.excludedValues = options?.excludeValues ? options.excludeValues(meta.fields) : []
		this.excludedFields.push(
			...meta.fields.toArray().filter((c) => c.metadata.options.serverExpression),
		)
		this.excludedFields.push(...meta.fields.toArray().filter((c) => c.metadata.options.sqlExpression))
		this.fields = meta.fields.toArray().filter((f) => !this.excludedFields.includes(f))
	}
}

const REDACT = '[REDACTED]'

function jsonValue(c: FieldRef<any, any>, value: unknown) {
	if (value instanceof IdEntity) return value.id
	const conv = c.metadata.options.valueConverter
	if (conv?.toJson) return conv.toJson(value)
	return value
}

/**
 * Build the `changes` payload for an audit event from a Remult lifecycle event.
 * Returns a JSON-Patch-style array (RFC 6902 subset) limited to changed fields.
 */
function buildChanges<entityType>(
	entity: entityType,
	e: LifecycleEvent<entityType>,
	options: EvlogColumnDeciderArgs<entityType> | undefined,
	mode: 'save' | 'delete',
) {
	const decider = new FieldDecider(entity, options)
	const isNew = mode === 'save' && e.isNew
	const ops: Array<{
		op: 'add' | 'remove' | 'replace'
		path: string
		value?: unknown
		from?: unknown
	}> = []

	const candidates =
		mode === 'delete'
			? decider.fields
			: decider.fields.filter((c) => c.valueChanged() || (isNew && c.value))

	for (const c of candidates) {
		const noVal = decider.excludedValues.includes(c)
		const path = '/' + c.metadata.key
		if (mode === 'delete') {
			ops.push({
				op: 'remove',
				path,
				from: noVal ? REDACT : jsonValue(c, c.originalValue),
			})
		} else if (isNew) {
			ops.push({
				op: 'add',
				path,
				value: noVal ? REDACT : jsonValue(c, c.value),
			})
		} else {
			ops.push({
				op: 'replace',
				path,
				from: noVal ? REDACT : jsonValue(c, c.originalValue),
				value: noVal ? REDACT : jsonValue(c, c.value),
			})
		}
	}

	return ops
}

/**
 * Wrap entity options with audit logging via evlog.
 *
 * Mirrors `withChangeLog` shape but emits structured `audit()` events instead
 * of inserting into a Remult-managed `_ff_change_logs` row directly. The audit
 * stream is then routed to whatever drain(s) the `evlog()` module is configured
 * with (default: a Remult-backed drain writing into `_ff_evlog_audit`).
 *
 * Use `evlog.module` to tag every audit emitted from this entity with the
 * owning Remult module name (read by dashboards / queries).
 *
 * @example
 * ```ts
 * import { Entity } from 'remult'
 * import { withEvlog } from 'firstly/evlog'
 *
 * \@Entity('tasks', withEvlog({ evlog: { module: 'task' } }))
 * class Task { ... }
 * ```
 */
export const withEvlog = <entityType>(
	options?: EntityOptions<entityType> & { evlog?: false | EvlogColumnDeciderArgs<entityType> },
): EntityOptions<entityType> => {
	return {
		...options,

		saved: async (entity, e) => {
			await options?.saved?.(entity, e)
			if (options?.evlog === false || !isBackend()) return
			// Audit capture is best-effort: a failure here (bad valueConverter,
			// non-serializable field, logger error) must never reject the user's
			// write. The drain side is already guarded the same way.
			try {
				const { recordAudit } = await import('./server/recordAudit.js')
				await recordAudit(entity, e, options?.evlog, 'save')
			} catch (err) {
				console.error('[firstly/evlog] audit capture failed (save):', err)
			}
		},

		deleted: async (entity, e) => {
			await options?.deleted?.(entity, e)
			if (options?.evlog === false || !isBackend()) return
			try {
				const { recordAudit } = await import('./server/recordAudit.js')
				await recordAudit(entity, e, options?.evlog, 'delete')
			} catch (err) {
				console.error('[firstly/evlog] audit capture failed (delete):', err)
			}
		},
	}
}

export { buildChanges }
