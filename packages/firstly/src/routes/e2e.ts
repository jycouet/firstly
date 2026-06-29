import { expect, test } from '@playwright/test'

test('Home page loads', async ({ page }) => {
	await page.goto('/')
	await expect(page).toHaveTitle('Firstly')
})

// ApiItem is seeded with 2 rows (1 pub, 1 private). apiPrefilter exposes only `pub`,
// so a gated read returns exactly 1 row through either wrapper.

test('remultApiUniversalLoad gates the universal read (SSR)', async ({ page }) => {
	await page.goto('/remult-api-universal')
	await expect(page.locator('[data-count]')).toHaveText('1')
	await expect(page.locator('[data-item]')).toHaveText('public item')
	await expect(page.locator('[data-provider]')).toHaveText('RestDataProvider')
})

test('remultApiServerLoad gates the server read', async ({ page }) => {
	await page.goto('/remult-api-server')
	await expect(page.locator('[data-count]')).toHaveText('1')
	await expect(page.locator('[data-item]')).toHaveText('public item')
})
