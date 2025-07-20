import { BackendMethod, repo } from 'remult'
import { dateCompact, strTrimMid } from '@kitql/helpers'

import { CarboneLog, CarboneTemplate, CarbonLogAction } from './carboneEntities'
import { Roles_Carbon } from './Roles_Carbon'
import type { CarboneServer } from './server/CarboneServer'

export class CarboneController {
	public static server: CarboneServer

	@BackendMethod({
		allowed: [Roles_Carbon.Carbon_Admin, Roles_Carbon.Carbon_UploadTemplate],
		apiPrefix: 'carbone',
	})
	static async uploadTemplate(config: { name: string; base64: string; nameForCarbone?: string }) {
		const { name, base64, nameForCarbone } = config

		// 30 max                                                         1    13
		const nameToUse =
			strTrimMid(nameForCarbone ?? name, { len: 16, midStr: '-' }) + '_' + dateCompact()

		const res = await CarboneController.server.fetch({
			api: `/template`,
			body: JSON.stringify({ name, template: base64 }),
			headers: {
				'carbone-template-name': nameToUse,
			},
		})
		const j = await res.json()
		const templateId = j.data.templateId
		await repo(CarboneTemplate).upsert({
			where: { id: templateId, name, extension: j.data.templateExtension },
		})
		await repo(CarboneLog).insert({
			templateId,
			action: CarbonLogAction.template_upload,
		})
	}

	@BackendMethod({
		allowed: [Roles_Carbon.Carbon_Admin, Roles_Carbon.Carbon_DownloadTemplate],
		apiPrefix: 'carbone',
	})
	static async downloadTemplate(config: {
		templateName?: string
		templateId?: string
		templateExtension?: string
		filename?: string
	}) {
		const { templateName, filename } = config
		let { templateId, templateExtension } = config

		if (templateName) {
			const t = await repo(CarboneTemplate).findFirst({ name: templateName })
			if (!t) {
				throw new Error('Template not found')
			}
			templateId = t.id
			templateExtension = t.extension
		}

		const response = await CarboneController.server.fetch({
			api: `/template/${templateId}`,
			method: 'GET',
		})

		await repo(CarboneLog).insert({
			templateId,
			action: CarbonLogAction.template_download,
		})

		const contentType = response.headers.get('content-type')
		const arrayBuffer = await response.arrayBuffer()
		const base64 = Buffer.from(arrayBuffer).toString('base64')
		const filenameToUse = filename ?? templateName ?? `template_${templateId}`
		return {
			data: base64,
			contentType: contentType || 'application/octet-stream',
			filename: `${filenameToUse}.${templateExtension}`,
		}
	}

	@BackendMethod({
		allowed: [Roles_Carbon.Carbon_Admin, Roles_Carbon.Carbon_DeleteTemplate],
		apiPrefix: 'carbone',
	})
	static async deleteTemplate(config: { templateId: string }) {
		const { templateId } = config

		const response = await CarboneController.server.fetch({
			api: `/template/${templateId}`,
			method: 'DELETE',
		})

		await repo(CarboneLog).insert({
			templateId,
			action: CarbonLogAction.template_delete,
		})

		await repo(CarboneTemplate).delete({ id: templateId })
	}

	@BackendMethod({
		allowed: [Roles_Carbon.Carbon_Admin, Roles_Carbon.Carbon_Render],
		apiPrefix: 'carbone',
	})
	static async render(config: {
		templateName?: string
		templateId?: string
		templateBase64?: string

		//
		data: Record<string, any>
		convertTo?: 'pdf'

		//
		filename?: string
	}) {
		const { templateName, templateBase64, data, convertTo = 'pdf', filename } = config
		let { templateId } = config

		let mode = ''
		if (templateBase64) {
			mode = 'templateBase64'
		} else if (templateName) {
			mode = 'templateName'
			const t = await repo(CarboneTemplate).findFirst({ name: templateName })
			if (!t) {
				throw new Error('Template not found')
			}
			templateId = t.id
		} else {
			mode = 'templateId'
		}

		const response = templateBase64
			? await CarboneController.server.fetch({
					api: `/render/template?download=true`,
					body: JSON.stringify({ data, template: templateBase64, convertTo }),
				})
			: await CarboneController.server.fetch({
					api: `/render/${templateId}?download=true`,
					body: JSON.stringify({ data, convertTo }),
				})

		await repo(CarboneLog).insert({
			templateId: mode === 'templateBase64' ? 'templateBase64' : templateId,
			action: CarbonLogAction.render,
		})

		const contentType = response.headers.get('content-type')
		const arrayBuffer = await response.arrayBuffer()
		const base64 = Buffer.from(arrayBuffer).toString('base64')
		const filenameToUse = filename ?? `template_${templateId}`
		return {
			data: base64,
			contentType: contentType || 'application/octet-stream',
			filename: `${filenameToUse}.${convertTo}`,
		}
	}
}
