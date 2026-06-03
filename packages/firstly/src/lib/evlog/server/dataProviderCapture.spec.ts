import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { InMemoryDataProvider, remult } from 'remult'

import {
	captureDataProvider,
	inDetachedContext,
	resetCapturedDataProvider,
} from './dataProviderCapture.js'

describe('dataProviderCapture', () => {
	beforeEach(() => resetCapturedDataProvider())
	afterEach(() => resetCapturedDataProvider())

	it('first capture wins so a concurrent per-request dataProvider cannot hijack an in-flight drain', async () => {
		const dpA = new InMemoryDataProvider()
		const dpB = new InMemoryDataProvider()

		captureDataProvider(dpA) // request A (or boot)
		captureDataProvider(dpB) // concurrent request B must NOT replace A's provider

		let seen: unknown
		await inDetachedContext(async () => {
			seen = remult.dataProvider
		})
		expect(seen).toBe(dpA)
	})
})
