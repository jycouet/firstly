import { Entity, Fields } from 'remult'

// Demo entity with an API gate: through the API only `pub` rows are visible.
// In-process (privileged) server reads see all rows. Used by the
// remultApiUniversalLoad / remultApiServerLoad demo routes + tests.
@Entity<ApiItem>('demo_api_items', {
	allowApiCrud: true,
	apiPrefilter: () => ({ pub: true }),
})
export class ApiItem {
	@Fields.id() id = ''
	@Fields.string() title = ''
	@Fields.boolean() pub = false
}
