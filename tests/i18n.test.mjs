import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createI18n, MESSAGES } from '../src/i18n/catalog.ts'
import { ALL_ALGORITHM_IDS, ALGORITHMS } from '../src/sorting/algorithms.ts'
import { DATASETS, makeDataset } from '../src/sorting/datasets.ts'

test('every interface message has a complete English/Persian pair', () => {
  for (const [key, pair] of Object.entries(MESSAGES)) {
    assert.equal(pair.length, 2, key)
    assert.ok(pair[0].trim().length > 0, key)
    assert.ok(/[\u0600-\u06ff]/u.test(pair[1]), `Missing Persian text: ${key}`)
    const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
    assert.deepEqual(placeholders(pair[0]), placeholders(pair[1]), `Placeholder mismatch: ${key}`)
  }
})

test('algorithm descriptions, tags, datasets, and operation narration all translate without changing traces', () => {
  const en = createI18n('en')
  const fa = createI18n('fa')
  for (const id of ALL_ALGORITHM_IDS) {
    const translated = fa.algorithm(id)
    for (const text of [translated.name, translated.description, translated.note, ...translated.tags]) {
      assert.ok(/[\u0600-\u06ff]/u.test(text))
      assert.ok(!/[a-z]/i.test(text), `Untranslated metadata: ${text}`)
    }
    for (const pattern of ['reversed', 'duplicates']) {
      const source = makeDataset(12, 42, pattern)
      const input = id === 'binary' ? [...source].sort((a, b) => a - b) : source
      const trace = ALGORITHMS[id].trace(input)
      const original = JSON.stringify(trace)
      for (const operation of trace) {
        assert.ok(/[\u0600-\u06ff]/u.test(fa.operation(operation)))
        assert.ok(!/[{}]/u.test(fa.operation(operation)), `Unfilled narration: ${operation.message.key}`)
        assert.ok(!/[{}]/u.test(en.operation(operation)))
      }
      assert.equal(JSON.stringify(trace), original)
    }
  }
  for (const dataset of DATASETS) assert.ok(/[\u0600-\u06ff]/u.test(fa.dataset(dataset.id)))
})

test('numbers and interpolation use the selected locale, including decimal speeds', () => {
  const en = createI18n('en')
  const fa = createI18n('fa')
  assert.equal(en.n(1234), '1,234')
  assert.equal(fa.n(1234), '۱٬۲۳۴')
  assert.equal(fa.n(0.25), '۰٫۲۵')
  assert.equal(fa.n(0, 1), '۰٫۰')
  assert.equal(en.t('timelineValue', { current: 5, total: 100 }), 'Step 5 of 100')
  assert.equal(fa.t('timelineValue', { current: 5, total: 100 }), 'گام ۵ از ۱۰۰')
  assert.equal(fa.values([1, 2, 3]), '۱، ۲، ۳')
})
