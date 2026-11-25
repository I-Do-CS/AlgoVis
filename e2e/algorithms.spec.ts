import { expect, test, type Page } from '@playwright/test'

async function values(page: Page): Promise<number[]> {
  return (await page.getByTestId('array-values').innerText()).split(', ').map(Number)
}

async function prepare(page: Page) {
  await page.goto('/')
  const size = page.getByRole('slider', { name: /Array size/ })
  await size.focus()
  await size.press('Home')
  await page.getByText('Inspect array values', { exact: false }).click()
}

for (const [id, name] of [
  ['insertion', 'Insertion sort'], ['bubble', 'Bubble sort'], ['selection', 'Selection sort'],
  ['merge', 'Merge sort'], ['quick', 'Quicksort'],
  ['counting', 'Counting sort'], ['radix', 'Radix sort'],
]) {
  test(`${name} sorts duplicate values and resets to the exact original input`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await prepare(page)
    await page.getByRole('combobox', { name: 'Dataset' }).selectOption('duplicates')
    await page.getByRole('combobox', { name: 'Algorithm', exact: true }).selectOption(id)
    const original = await values(page)
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    await expect(page.locator('.code-block')).toHaveAttribute('aria-label', `${name} pseudocode`)
    const speed = page.getByRole('slider', { name: /Speed/ })
    await speed.focus()
    await speed.press('End')
    await page.getByRole('button', { name: 'Start sorting' }).click()
    await expect(page.locator('.status')).toHaveText('Sorted')
    expect(await values(page)).toEqual([...original].sort((a, b) => a - b))
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    await page.getByRole('button', { name: 'Reset array' }).click()
    expect(await values(page)).toEqual(original)
    await expect(page.getByRole('combobox', { name: 'Algorithm', exact: true })).toHaveValue(id)
    await expect(page.getByRole('combobox', { name: 'Dataset' })).toHaveValue('duplicates')
    await expect(page.getByTestId('writes')).toHaveText('0')
    expect(errors).toEqual([])
  })
}

test('dataset presets have the advertised ordering; resize retains the preset', async ({ page }) => {
  await prepare(page)
  const dataset = page.getByRole('combobox', { name: 'Dataset' })
  await dataset.selectOption('sorted')
  const sorted = await values(page)
  expect(sorted).toEqual([...sorted].sort((a, b) => a - b))
  await dataset.selectOption('reversed')
  expect(await values(page)).toEqual([...sorted].reverse())
  await dataset.selectOption('nearly-sorted')
  const nearly = await values(page)
  expect([...nearly].sort((a, b) => a - b)).toEqual(sorted)
  expect(nearly.filter((value, index) => value !== sorted[index])).toHaveLength(2)
  await dataset.selectOption('duplicates')
  expect(new Set(await values(page)).size).toBe(5)
  const size = page.getByRole('slider', { name: /Array size/ })
  await size.focus()
  await size.press('End')
  expect(await values(page)).toHaveLength(96)
  expect(new Set(await values(page)).size).toBe(5)
  await page.getByRole('button', { name: 'Start sorting' }).click()
  await dataset.selectOption('reversed')
  await expect(page.locator('.status')).toHaveText('Ready to sort')
  await expect(page.getByTestId('writes')).toHaveText('0')
  const reversed = await values(page)
  expect(reversed).toEqual([...reversed].sort((a, b) => b - a))
})

test('switching algorithms or shuffling during a merge preserves the original multiset', async ({ page }) => {
  await prepare(page)
  const algorithm = page.getByRole('combobox', { name: 'Algorithm', exact: true })
  await algorithm.selectOption('merge')
  await page.getByRole('combobox', { name: 'Dataset' }).selectOption('reversed')
  const original = await values(page)
  // Three splits, one buffer comparison, then the first write.
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Step', exact: true }).click()
  await expect(page.getByTestId('writes')).toHaveText('1')
  expect(new Set(await values(page)).size).toBe(7)
  await expect(page.getByTestId('operation-description')).toContainText('auxiliary buffer')
  await page.screenshot({ path: '/tmp/algovis-m2-merge-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.locator('canvas').evaluate((canvas: HTMLCanvasElement) =>
    canvas.width === Math.round(canvas.getBoundingClientRect().width * window.devicePixelRatio),
  )).toBe(true)
  await page.screenshot({ path: '/tmp/algovis-m2-merge-mobile.png', fullPage: true })
  await algorithm.selectOption('quick')
  expect(await values(page)).toEqual(original)
  await expect(page.getByTestId('writes')).toHaveText('0')
  await page.getByRole('button', { name: 'Start sorting' }).click()
  await algorithm.selectOption('merge')
  await expect(page.locator('.status')).toHaveText('Ready to sort')
  expect(await values(page)).toEqual(original)
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Step', exact: true }).click()
  await page.getByRole('button', { name: 'Shuffle array' }).click()
  expect((await values(page)).sort((a, b) => a - b)).toEqual([...original].sort((a, b) => a - b))
  await expect(page.getByRole('combobox', { name: 'Dataset' })).toHaveValue('random')
  await expect(page.locator('.status')).toHaveText('Ready to sort')
})

test('all algorithms fit phone, tablet, and desktop layouts', async ({ page }) => {
  await page.goto('/')
  for (const id of ['insertion', 'bubble', 'selection', 'merge', 'quick', 'counting', 'radix']) {
    await page.getByRole('combobox', { name: 'Algorithm', exact: true }).selectOption(id)
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1100 })
      await expect(page.getByRole('button', { name: 'Start sorting' })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), `${id} overflows at ${width}px`).toBe(false)
    }
  }
  await page.getByRole('combobox', { name: 'Algorithm', exact: true }).selectOption('quick')
  await page.getByRole('button', { name: 'Step', exact: true }).click()
  await expect(page.getByTestId('operation-description')).toContainText('pivot')
  await expect(page.locator('.legend')).toContainText('Pivot')
  await page.screenshot({ path: '/tmp/algovis-m2-quick-desktop.png', fullPage: true })
})
