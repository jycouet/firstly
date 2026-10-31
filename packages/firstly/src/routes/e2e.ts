import { expect, test, type Page } from '@playwright/test'

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

const trackApi = (page: Page) => {
	const reqs: string[] = []
	page.on('request', (r) => {
		if (r.url().includes('/api/') && !r.url().includes('/api/stream'))
			reqs.push(`${r.method()} ${r.url().replace(/^.*\/api\//, '')}`)
	})
	return reqs
}
const seed = async (page: Page, title: string) => {
	const res = await page.request.post('/api/demo_tasks', { data: { title } })
	return (await res.json()).id as string
}
const settled = (page: Page) => page.waitForTimeout(600)

test('repoClient: API rules on SSR, nothing refetched on hydration', async ({ page }) => {
	await seed(page, 'hydrate me')
	const html = await (await page.request.get('/repo-client')).text()
	expect(html).toContain('public item')
	expect(html).not.toContain('private item')
	expect(html).toContain('hydrate me')

	const reqs = trackApi(page)
	await page.goto('/repo-client', { waitUntil: 'networkidle' })
	await settled(page)
	await expect(page.locator('[data-count]')).toHaveText('1')
	expect(reqs).toEqual([])
})

test('repoClient: filter refetches once, writes refresh', async ({ page }) => {
	const title = `row-${Date.now()}`
	await page.goto('/repo-client', { waitUntil: 'networkidle' })
	await settled(page)
	const reqs = trackApi(page)

	await page.locator('[data-title]').fill(title)
	await page.locator('[data-add]').click()
	await expect(page.locator('[data-task]', { hasText: title })).toHaveCount(1)
	expect(reqs.filter((r) => r.startsWith('POST'))).toHaveLength(1)

	reqs.length = 0
	await page.locator('[data-search]').fill(title)
	await expect(page.locator('[data-task]')).toHaveCount(1)
	await settled(page)
	expect(reqs).toHaveLength(1)

	reqs.length = 0
	await page.locator('[data-remove]').click()
	await expect(page.locator('[data-task]')).toHaveCount(0)
})

test('repoClient: detail page, param change does one find per read', async ({ page }) => {
	const a = await seed(page, 'detail a')
	const b = await seed(page, 'detail b')
	const reqs = trackApi(page)
	await page.goto(`/repo-client/${a}`, { waitUntil: 'networkidle' })
	await settled(page)
	await expect(page.locator('[data-detail]')).toHaveText('detail a')
	expect(reqs).toEqual([])

	await page.locator(`a[href="/repo-client/${b}"]`).click()
	await expect(page.locator('[data-detail]')).toHaveText('detail b')
	await settled(page)
	expect(reqs.filter((r) => r.includes(b))).toHaveLength(1)
})

test('repoClient: paginator replays too, next page fetches', async ({ page }) => {
	await seed(page, 'p1')
	await seed(page, 'p2')
	await seed(page, 'p3')
	const reqs = trackApi(page)
	await page.goto('/repo-client/paginate', { waitUntil: 'networkidle' })
	await settled(page)
	await expect(page.locator('[data-task]')).toHaveCount(2)
	expect(reqs).toEqual([])
	await page.locator('[data-more]').click()
	await expect(page.locator('[data-task]')).toHaveCount(4)
	expect(reqs).toHaveLength(1)
})

test('repoClient: a row cannot break out of the replay tag', async ({ page }) => {
	const title = `</script><script>window.__pwned = 1</script>$'$&`
	const id = await seed(page, title)
	const errors: string[] = []
	page.on('pageerror', (e) => errors.push(e.message))
	await page.goto(`/repo-client/${id}`, { waitUntil: 'networkidle' })
	await settled(page)
	await expect(page.locator('[data-detail]')).toHaveText(title)
	expect(await page.evaluate(() => (window as any).__pwned)).toBeUndefined()
	expect(errors).toEqual([])
	await page.request.delete(`/api/demo_tasks/${id}`)
})
