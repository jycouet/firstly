import { env } from '$env/dynamic/private'

// Nothing is required: repos are resolved to their own PDS and handles go through the public
// network. Point `AT_PDS_URL` at a local PDS (airspace's `pnpm dev:pds`) when its handles / dids
// are not on the public network.
export const atConfig = {
	pds: env.AT_PDS_URL || undefined,
	plc: env.AT_PLC_URL || undefined,
	get local() {
		return !!this.pds?.startsWith('http://')
	},
}
