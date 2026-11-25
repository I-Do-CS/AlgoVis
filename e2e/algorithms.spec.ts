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

test('radix shows incremental output and named digit passes while preserving reverse seeking and RTL', async ({ page }) => {
  await prepare(page)
  await page.getByRole('combobox', { name: 'Algorithm', exact: true }).selectOption('radix')
  await page.getByRole('combobox', { name: 'Dataset' }).selectOption('sorted')
  const original = await values(page)
  const timeline = page.getByRole('slider', { name: /^Timeline/ })
  const seek = async (position: number) => {
    await timeline.fill(String(position))
  }
  // Start a units pass, count eight keys, accumulate ten buckets, then place one item.
  await seek(20)
  await expect(page.getByTestId('radix-pass')).toHaveText('Pass 1 of 3 · Units')
  await expect(page.getByTestId('output-progress')).toHaveText('Output buffer: 1 of 8 positions filled.')
  await expect(page.getByTestId('radix-digit')).toContainText('Units digit: 0')
  expect(await values(page)).toEqual(original)
  await page.screenshot({ path: '/tmp/algovis-radix-output-desktop.png', fullPage: true })
  await seek(27)
  await expect(page.getByTestId('output-progress')).toContainText('8 of 8')
  await seek(36)
  await expect(page.locator('.bucket-heading')).toContainText('Digit pass complete')
  expect(await values(page)).toEqual([10, 100, 61, 23, 74, 36, 87, 49])
  await expect(page.locator('.status')).toHaveText('Paused')
  await seek(37)
  await expect(page.getByTestId('radix-pass')).toHaveText('Pass 2 of 3 · Tens')
  await expect(page.getByTestId('output-progress')).toContainText('0 of 8')
  await seek(20)
  await expect(page.getByTestId('output-progress')).toContainText('1 of 8')
  expect(await values(page)).toEqual(original)
  await page.getByRole('button', { name: 'فارسی', exact: true }).click()
  await expect(page.getByTestId('radix-pass')).toHaveText('دور ۱ از ۳ · یکان')
  await expect(page.getByTestId('output-progress')).toContainText('۱ جایگاه از ۸')
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1100 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), `radix overflow at ${width}`).toBe(false)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: '/tmp/algovis-radix-output-persian-mobile.png', fullPage: true })
  const rtlTimeline = page.getByRole('slider', { name: /^خط زمان/ })
  await rtlTimeline.fill(await rtlTimeline.getAttribute('max') ?? '0')
  await expect(page.locator('.status')).toHaveText('مرتب شد')
  await expect(page.getByTestId('radix-pass')).toHaveText('دور ۳ از ۳ · صدگان')
})
