import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ALGORITHMS, ALGORITHM_IDS } from '../src/sorting/algorithms.ts'
import { DATASETS, makeDataset, shuffleValues } from '../src/sorting/datasets.ts'
import { SortPlayer } from '../src/sorting/player.ts'

for (const id of ALGORITHM_IDS) {
  test(`${id}: sorts every preset and edge case, preserves input and element identities`, () => {
    const cases = [[], [7], [2, 1], [1, 1, 1, 1], [3, 1, 3, 0, -2, 1]]
    for (const pattern of DATASETS) {
      for (const size of [8, 31, 96]) {
        for (let seed = 0; seed < 5; seed++) cases.push(makeDataset(size, seed, pattern.id))
      }
    }
    for (const input of cases) {
      const original = [...input]
      const player = new SortPlayer(input, id)
      player.play()
      player.advance(1_000_000)
      const state = player.getSnapshot()
      assert.equal(state.status, 'complete')
      assert.deepEqual(state.values, [...original].sort((a, b) => a - b))
      assert.deepEqual(input, original)
      const items = player.getFrame().items
      assert.deepEqual(items.map((item) => item.id).sort((a, b) => a - b), input.map((_, i) => i))
      assert.ok(items.every((item) => item.value === original[item.id]))
      for (const operation of ALGORITHMS[id].trace(input)) {
        assert.ok(operation.lines.every((line) => line >= 0 && line < ALGORITHMS[id].code.length))
        if ('indices' in operation) assert.ok(operation.indices.every((index) => index >= 0 && index < input.length))
      }
    }
  })
}

test('insertion, bubble, and merge preserve the original order of equal values', () => {
  for (const id of ['insertion', 'bubble', 'merge']) {
    const player = new SortPlayer([3, 1, 2, 1, 3, 2], id)
    player.play()
    player.advance(100_000)
    assert.deepEqual(player.getFrame().items.map((item) => item.id), [1, 3, 2, 5, 0, 4])
  }
})

test('known comparison and main-array write counts match each algorithm', () => {
  const cases = [
    ['insertion', [5, 4, 3, 2, 1], 10, 20],
    ['bubble', [1, 2, 3, 4, 5], 4, 0],
    ['selection', [6, 5, 4, 3, 2, 1], 15, 6],
    ['merge', [1, 2, 3, 4, 5, 6, 7, 8], 12, 24],
    ['quick', [1, 2, 3, 4, 5], 10, 0],
  ]
  for (const [id, input, comparisons, writes] of cases) {
    const player = new SortPlayer(input, id)
    player.play()
    player.advance(100_000)
    assert.equal(player.getSnapshot().comparisons, comparisons, `${id} comparisons`)
    assert.equal(player.getSnapshot().writes, writes, `${id} writes`)
  }
})

test('merge pauses and resumes halfway through a buffer write; stepping finishes only that write', () => {
  const player = new SortPlayer([2, 1], 'merge')
  player.setSpeed(10)
  player.step() // Split.
  player.step() // Compare the buffered values.
  player.play()
  player.advance(50)
  const transition = player.getFrame().writeTransition
  assert.equal(transition.progress, 0.5)
  assert.equal(transition.from.value, 2)
  assert.equal(transition.to.value, 1)
  player.pause()
  const paused = player.getSnapshot()
  player.advance(1000)
  assert.deepEqual(player.getSnapshot(), paused)
  player.setSpeed(20)
  assert.equal(player.getFrame().writeTransition.progress, 0.5)
  player.step()
  assert.equal(player.getSnapshot().writes, 1)
  assert.equal(player.getSnapshot().completed, 3)
  player.step()
  assert.deepEqual(player.getSnapshot().values, [1, 2])
  assert.equal(player.getSnapshot().writes, 2)
})

test('algorithm changes and reset restore the original multiset, even during an unfinished merge', () => {
  const original = [2, 1]
  const player = new SortPlayer(original, 'merge')
  player.step()
  player.step()
  player.step() // The main array temporarily contains [1, 1]; the buffer retains 2.
  assert.deepEqual(player.getSnapshot().values, [1, 1])
  assert.deepEqual(player.getOriginalValues(), original)
  for (const id of ALGORITHM_IDS) {
    player.setAlgorithm(id)
    assert.deepEqual(player.getSnapshot().values, original)
    assert.equal(player.getSnapshot().algorithm, id)
    assert.equal(player.getSnapshot().status, 'ready')
    assert.equal(player.getSnapshot().completed, 0)
    player.play()
    player.advance(100_000)
  }
  player.reset()
  assert.deepEqual(player.getSnapshot().values, original)
  const copy = player.getOriginalValues()
  copy[0] = 999
  assert.deepEqual(player.getOriginalValues(), original)
})

test('all algorithms share pause, stepping, replay, and frame-rate-independent counts', () => {
  for (const id of ALGORITHM_IDS) {
    const runs = [1000 / 30, 1000 / 144].map((delta) => {
      const player = new SortPlayer(makeDataset(12, 42), id)
      player.setSpeed(100)
      player.step()
      assert.equal(player.getSnapshot().completed, 1)
      player.play()
      player.advance(3)
      player.pause()
      const paused = player.getSnapshot()
      player.advance(1000)
      assert.deepEqual(player.getSnapshot(), paused)
      player.play()
      while (player.getSnapshot().status !== 'complete') player.advance(delta)
      const result = player.getSnapshot()
      player.play()
      assert.equal(player.getSnapshot().status, 'playing')
      assert.deepEqual(player.getSnapshot().values, player.getOriginalValues())
      return result
    })
    assert.deepEqual(runs[0].values, runs[1].values)
    assert.equal(runs[0].comparisons, runs[1].comparisons)
    assert.equal(runs[0].writes, runs[1].writes)
    assert.ok(Math.abs(runs[0].elapsedMs - runs[1].elapsedMs) < 0.001)
  }
})

test('presets are reproducible, ordered as advertised, and shuffling preserves values', () => {
  for (const size of [0, 1, 8, 50, 96]) {
    for (const pattern of DATASETS) {
      assert.deepEqual(makeDataset(size, 17, pattern.id), makeDataset(size, 17, pattern.id))
      assert.equal(makeDataset(size, 17, pattern.id).length, size)
    }
    const sorted = makeDataset(size, 17, 'sorted')
    assert.deepEqual(sorted, [...sorted].sort((a, b) => a - b))
    assert.deepEqual(makeDataset(size, 17, 'reversed'), [...sorted].reverse())
    const nearly = makeDataset(size, 17, 'nearly-sorted')
    assert.deepEqual([...nearly].sort((a, b) => a - b), sorted)
    assert.ok(nearly.filter((value, i) => value !== sorted[i]).length <= Math.max(2, Math.floor(size * 0.08) * 2))
  }
  const duplicates = makeDataset(50, 42, 'duplicates')
  assert.equal(new Set(duplicates).size, 5)
  assert.deepEqual(shuffleValues(duplicates, 10).sort((a, b) => a - b), [...duplicates].sort((a, b) => a - b))
})
