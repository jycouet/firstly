import { buildAuditFields, createLogger, type AuditInput } from 'evlog'

import { remult, type LifecycleEvent } from 'remult'

import { buildChanges, type EvlogColumnDeciderArgs } from '../withEvlog.js'

/**
 * Emit one audit wide event for a Remult entity lifecycle change.
 *
 * Called from `withEvlog`'s `saved` / `deleted` hooks (which run inside the
 * Remult transaction). Bypasses `audit()` standalone so we can attach the
 * owning module name as a top-level event field (visible to the trace drain
 * and to any drain that wants to slice by module).
 */
export async function recordAudit<entityType>(
	entity: entityType,
	e: LifecycleEvent<entityType>,
	options: EvlogColumnDeciderArgs<entityType> | undefined,
	mode: 'save' | 'delete',
) {
	const changes = buildChanges(entity, e, options, mode)
	if (mode === 'save' && changes.length === 0) return

	const entityKey = e.metadata.key
	const entityId = String(e.metadata.idMetadata.getId(entity))
	const isNew = mode === 'save' && e.isNew
	const verb = mode === 'delete' ? 'delete' : isNew ? 'create' : 'update'

	const input: AuditInput = {
		action: `${entityKey}.${verb}`,
		actor: {
			type: remult.user ? 'user' : 'system',
			id: remult.user?.id ?? 'system',
			displayName: remult.user?.name,
		},
		target: { type: entityKey, id: entityId },
		outcome: 'success',
		changes: { patch: changes } as never,
	}

	const fields = buildAuditFields(input)
	createLogger({ audit: fields, module: options?.module }).emit({ _forceKeep: true })
}
