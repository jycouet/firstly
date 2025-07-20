import { Log } from '@kitql/helpers'

import { CarboneLog, CarboneTemplate } from './carboneEntities'

export { Roles_Carbon as Roles_Mail } from './Roles_Carbon'

export const key = 'carbone'

export const log = new Log(key)

export const carbonEntities = {
	CarboneTemplate,
	CarboneLog,
}

/**
 * Converts a File object to base64 string (without data URL prefix)
 * @param file - The File object to convert
 * @returns Promise<string> - Base64 string without data URL prefix
 */
export const fileToBase64 = (file: File): Promise<string> => {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			const result = reader.result as string
			// Remove data URL prefix to get just the base64 content
			const base64Content = result.split(',')[1]
			resolve(base64Content)
		}
		reader.onerror = reject
		reader.readAsDataURL(file)
	})
}

/**
 * Downloads a file from base64 data
 * @param base64Data - The base64 encoded file data
 * @param filename - The filename for the download
 * @param contentType - The MIME type of the file
 */
export const downloadFile = (base64Data: string, filename: string, contentType: string): void => {
	try {
		// Convert base64 to blob
		const byteCharacters = atob(base64Data)
		const byteNumbers = new Array(byteCharacters.length)
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i)
		}
		const byteArray = new Uint8Array(byteNumbers)
		const blob = new Blob([byteArray], { type: contentType })

		// Create download link
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = filename
		link.style.display = 'none'

		// Trigger download
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)

		// Clean up
		URL.revokeObjectURL(url)
	} catch (error) {
		console.error('Download failed:', error)
		throw error
	}
}

/**
 * File processing utilities for Carbone templates
 */
export const carboneFileUtils = {
	fileToBase64,
	downloadFile,
}
