import { test } from 'node:test'
import assert from 'node:assert/strict'
import { insertionTrace, makeDataset } from '../src/sorting/insertion.ts'
import { SortPlayer } from '../src/sorting/player.ts'

test('replaying traces sorts edge cases without mutating input or losing elements', () => {
  const cases = [[], [7], [1, 2, 3], [5, 4, 3, 2, 1], [3, 1, 3, 0, -2, 1]]
  for (let seed = 0; seed < 30; seed++) cases.push(makeDataset(50, seed))
  for (const input of cases) {
    const original = [...input]
    const result = [...input]
    for (const operation of insertionTrace(input)) {
      if (operation.type === 'swap') {
        const [a, b] = operation.indices
        ;[result[a], result[b]] = [result[b], result[a]]
      }
    }
    assert.deepEqual(result, [...original].sort((a, b) => a - b))
    assert.deepEqual(input, original)
  }
})

test('equal values preserve their identities and original order', () => {
  const player = new SortPlayer([2, 1, 2, 1, 2])
  player.play()
  player.advance(100_000)
  assert.deepEqual(player.getFrame().items.map(({ id }) => id), [1, 3, 0, 2, 4])
})

test('pause freezes partial swaps and speed changes preserve the current position', () => {
  const player = new SortPlayer([2, 1])
  player.setSpeed(10)
  player.play()
  player.advance(250) // Select + compare + half of a swap.
  assert.equal(player.getFrame().transition.progress, 0.5)
  player.pause()
  const paused = player.getSnapshot()
  player.advance(2000)
  assert.deepEqual(player.getSnapshot(), paused)
  player.setSpeed(20)
  assert.equal(player.getFrame().transition.progress, 0.5)
  player.play()
  player.advance(25)
  assert.deepEqual(player.getSnapshot().values, [1, 2])
  assert.equal(player.getSnapshot().status, 'complete')
})

test('single step completes exactly one operation, including a partially animated one', () => {
  const player = new SortPlayer([2, 1])
  player.step()
  assert.equal(player.getSnapshot().completed, 1)
  player.step()
  assert.equal(player.getSnapshot().comparisons, 1)
  player.play()
  player.advance(10)
  player.step()
  assert.equal(player.getSnapshot().completed, 3)
  assert.equal(player.getSnapshot().writes, 2)
  assert.equal(player.getSnapshot().status, 'complete')
})

test('reset restores the exact original array and clears all playback state', () => {
  const input = [4, 1, 3, 2]
  const player = new SortPlayer(input)
  player.play()
  player.advance(300)
  player.reset()
  const state = player.getSnapshot()
  assert.deepEqual(state.values, input)
  assert.equal(state.status, 'ready')
  assert.equal(state.completed + state.comparisons + state.writes + state.elapsedMs, 0)
  player.advance(10000)
  assert.deepEqual(player.getSnapshot(), state)
})

test('frame rate does not change output or counters; completion counts only consumed time', () => {
  const run = (frameMs) => {
    const player = new SortPlayer(makeDataset(20, 42))
    player.setSpeed(100)
    player.play()
    while (player.getSnapshot().status !== 'complete') player.advance(frameMs)
    return player.getSnapshot()
  }
  const slow = run(1000 / 30)
  const fast = run(1000 / 144)
  assert.deepEqual(slow.values, fast.values)
  assert.equal(slow.writes, fast.writes)
  assert.equal(slow.comparisons, fast.comparisons)
  assert.ok(Math.abs(slow.elapsedMs - fast.elapsedMs) < 0.001)
})

test('empty and singleton arrays complete safely; replay restarts a completed run', () => {
  for (const input of [[], [1]]) {
    const player = new SortPlayer(input)
    player.play()
    assert.equal(player.getSnapshot().status, 'complete')
    assert.equal(player.getSnapshot().progress, 1)
  }
  const player = new SortPlayer([2, 1])
  player.play()
  player.advance(1000)
  player.play()
  assert.equal(player.getSnapshot().status, 'playing')
  assert.deepEqual(player.getSnapshot().values, [2, 1])
})

test('invalid speeds and nonfinite values are rejected; shuffles are reproducible', () => {
  const player = new SortPlayer([1, 2])
  for (const speed of [0, -1, NaN, Infinity]) assert.throws(() => player.setSpeed(speed))
  assert.throws(() => player.load([1, NaN]))
  assert.deepEqual(makeDataset(50, 2026), makeDataset(50, 2026))
  assert.notDeepEqual(makeDataset(50, 2026), makeDataset(50, 2027))
})
