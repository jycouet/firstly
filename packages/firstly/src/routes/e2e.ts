import { expect, test } from '@playwright/test'

const REGEX_SP_URL = /\/sp\?q=abc$/

test('Home page loads', async ({ page }) => {
	await page.goto('/')
	await expect(page).toHaveTitle('Firstly')
})

// ApiItem is seeded with 2 rows (1 pub, 1 private). apiPrefilter exposes only `pub`,
// so a gated read returns exactly 1 row through either wrapper.

test('loadRepo gates the universal read (SSR)', async ({ page }) => {
	await page.goto('/remult-api-universal')
	await expect(page.locator('[data-count]')).toHaveText('1')
	await expect(page.locator('[data-item]')).toHaveText('public item')
})

test('loadRepo gates the server read', async ({ page }) => {
	await page.goto('/remult-api-server')
	await expect(page.locator('[data-count]')).toHaveText('1')
	await expect(page.locator('[data-item]')).toHaveText('public item')
})

test('SP filter change keeps scroll, focus and history', async ({ page }) => {
	const errors: string[] = []
	page.on('pageerror', (e) => errors.push(e.message))

	await page.goto('/sp')
	const filter = page.locator('[data-filter="true"]')
	await filter.focus()

	const before = await page.evaluate(() => ({ y: window.scrollY, entries: history.length }))
	expect(before.y).toBeGreaterThan(0)

	await page.keyboard.type('abc')

	await expect(page.locator('[data-search]')).toHaveText('?q=abc')
	await expect(page).toHaveURL(REGEX_SP_URL)
	await expect(filter).toBeFocused()
	expect(await page.evaluate(() => ({ y: window.scrollY, entries: history.length }))).toEqual(before)
	expect(errors).toEqual([])
})
