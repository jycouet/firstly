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

test('queryRepo gates SSR, hydrates without a query and follows repo writes', async ({ page }) => {
	const queries: string[] = []
	page.on('request', (r) => {
		if (r.url().includes('/_app/remote/') || r.url().includes('/api/')) queries.push(r.url())
	})

	await page.goto('/query-repo', { waitUntil: 'networkidle' })
	await expect(page.locator('[data-item]')).toHaveText('public item')
	expect(queries).toEqual([])

	const count = page.locator('[data-count]')
	const before = Number(await count.textContent())
	await page.locator('[data-add]').click()
	await expect(count).toHaveText(String(before + 1))
	await page.locator('[data-delete]').click()
	await expect(count).toHaveText(String(before))
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

const REGEX_SYMBOL = /<symbol /g
const REGEX_USE = /<use /g

for (const [ssr, symbols, uses] of [
	['false', 0, 0],
	['sprite', 7, 64],
	['true', 0, 0],
] as const) {
	test(`Icon ssr=${ssr}: server markup, then drawn inline once hydrated`, async ({
		page,
		request,
	}) => {
		const html = await (await request.get(`/icon?ssr=${ssr}`)).text()
		expect(html.match(REGEX_SYMBOL)?.length ?? 0).toBe(symbols)
		expect(html.match(REGEX_USE)?.length ?? 0).toBe(uses)

		const logs: string[] = []
		page.on('console', (m) => {
			if (m.type() === 'error' || m.type() === 'warning') logs.push(m.text())
		})
		await page.goto(`/icon?ssr=${ssr}`)
		const svgs = page.locator('[data-row] svg')
		await expect(svgs).toHaveCount(60)
		await expect
			.poll(() => svgs.evaluateAll((els) => els.filter((e) => !e.querySelector('path')).length))
			.toBe(0)
		expect(await page.locator('use').count()).toBe(0)
		await expect(page.locator('[data-misc] [aria-label="Skull"]')).toHaveAttribute(
			'stroke-width',
			'2',
		)
		await expect(page.locator('[data-misc] span b')).toHaveText('!')
		expect(logs).toEqual([])
	})
}
