import { expect, test, type Page } from '@playwright/test'

import { sleep } from '@kitql/helpers'

const getInfo = async (page: Page) => {
  const msgInfo = page.getByTestId('msg-info')
  const raw = await msgInfo.innerText()
  await sleep(112)
  try {
    const json = JSON.parse(raw.replace('User: ', ''))
    return json as Record<string, any>
  } catch (error) {
    return undefined
  }
}

const getMsg = async (page: Page, type: 'error' | 'success' = 'success') => {
  const msgInfo = page.getByTestId('msg-' + type)
  const raw = await msgInfo.innerText()
  await sleep(112)
  return raw
}

async function click(page: Page, text: string) {
  await page.getByText(text).click({})
  await sleep(111)
}

test.beforeEach(async ({ page }) => {
  await page.goto(`/auth`)
})

test('Arriving on the page, no users are logged', async ({ page }) => {
  await page.goto(`/auth`)
  expect(await getInfo(page)).toBe(undefined)
})

test('Log to demo, info ok', async ({ page }) => {
  await click(page, 'Noam')
  const user = await getInfo(page)
  expect(user!.name).toStrictEqual(`Noam`)
  expect(user!.roles).toStrictEqual([])
})

test('Log to demo, msg success', async ({ page }) => {
  await click(page, 'Ermin')
  const msg = await getMsg(page)
  expect(msg).toStrictEqual(`You're in with demo account!`)
})

test('Log to demo, msg error', async ({ page }) => {
  await click(page, 'JYC2')
  const msg = await getMsg(page, 'error')
  expect(msg).toStrictEqual(`JYC2 not found as demo account!`)
})
