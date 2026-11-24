import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ALGORITHM_IDS } from '../src/sorting/algorithms.ts'
import { makeDataset } from '../src/sorting/datasets.ts'
import { SortPlayer } from '../src/sorting/player.ts'
import { PlaybackSession } from '../src/sorting/session.ts'

for (const algorithm of ALGORITHM_IDS) {
  test(`${algorithm}: seeking matches linear replay across checkpoints, counters, and identities`, () => {
    const input = makeDataset(31, 42, 'duplicates')
    const player = new SortPlayer(input, algorithm)
    const linear = new SortPlayer(input, algorithm)
    const expected = []
    for (let i = 0; i <= linear.getTotal(); i++) {
      expected.push({ snapshot: linear.getSnapshot(), ids: linear.getFrame().items.map((item) => item.id) })
      linear.step()
    }
    const positions = [0, 1, 63, 64, 65, 127, 128, player.getTotal(), 64, 0]
    for (let seed = 0; seed < 30; seed++) positions.push((seed * 97) % (player.getTotal() + 1))
    for (const raw of positions) {
      const target = Math.min(raw, player.getTotal())
      player.seek(raw)
      const actual = player.getSnapshot()
      assert.deepEqual(actual.values, expected[target].snapshot.values)
      assert.equal(actual.comparisons, expected[target].snapshot.comparisons)
      assert.equal(actual.writes, expected[target].snapshot.writes)
      assert.deepEqual(actual.operation, expected[target].snapshot.operation)
      assert.deepEqual(player.getFrame().items.map((item) => item.id), expected[target].ids)
      assert.equal(actual.position, target)
      assert.equal(actual.elapsedMs, 0)
      assert.equal(actual.status, target === 0 ? 'ready' : target === player.getTotal() ? 'complete' : 'paused')
    }
    player.seek(65)
    player.play()
    player.advance(1_000_000)
    assert.deepEqual(player.getSnapshot().values, [...input].sort((a, b) => a - b))
  })
}

test('seeking interrupts a partial swap or merge write and restores the exact requested step', () => {
  for (const algorithm of ['insertion', 'merge']) {
    const player = new SortPlayer([2, 1], algorithm)
    player.setSpeed(10)
    player.play()
    player.advance(250)
    assert.ok(player.getFrame().transition || player.getFrame().writeTransition)
    player.seek(0)
    assert.deepEqual(player.getSnapshot().values, [2, 1])
    assert.equal(player.getFrame().transition, null)
    assert.equal(player.getFrame().writeTransition, null)
    assert.equal(player.getSnapshot().elapsedMs, 0)
  }
})

test('seek clamps endpoints, rejects nonfinite positions, and rebuilds checkpoints after input changes', () => {
  const player = new SortPlayer(makeDataset(96, 7, 'reversed'))
  for (const position of [NaN, Infinity, -Infinity]) assert.throws(() => player.seek(position))
  player.seek(-100)
  assert.equal(player.getPosition(), 0)
  player.seek(1_000_000)
  assert.equal(player.getPosition(), player.getTotal())
  player.load([3, 1, 2], 'merge')
  player.seek(1_000_000)
  assert.deepEqual(player.getSnapshot().values, [1, 2, 3])
  player.setAlgorithm('quick')
  player.seek(0)
  assert.deepEqual(player.getSnapshot().values, [3, 1, 2])
  for (const input of [[], [1]]) {
    player.load(input)
    player.seek(0)
    player.play()
    assert.equal(player.getStatus(), 'complete')
  }
})

test('comparison uses identical inputs and a shared step rate, and holds a completed side', () => {
  const input = makeDataset(12, 17, 'sorted')
  const session = new PlaybackSession(input, 'bubble', 'selection')
  session.setComparing(true)
  session.setSpeed(20)
  session.play()
  session.advance(125)
  assert.equal(session.primary.getPosition(), 2.5)
  assert.equal(session.secondary.getPosition(), 2.5)
  session.pause()
  session.advance(1000)
  assert.equal(session.primary.getPosition(), 2.5)
  session.play()
  session.advance(600)
  assert.equal(session.primary.getStatus(), 'complete')
  const finished = session.primary.getSnapshot()
  session.pause()
  session.play()
  session.advance(100)
  assert.deepEqual(session.primary.getSnapshot(), finished)
  assert.equal(session.secondary.getStatus(), 'playing')
  session.advance(100_000)
  assert.equal(session.getStatus(), 'complete')
  assert.deepEqual(session.primary.getSnapshot().values, session.secondary.getSnapshot().values)
  session.play()
  assert.equal(session.primary.getPosition(), 0)
  assert.equal(session.secondary.getPosition(), 0)
  assert.equal(session.getStatus(), 'playing')
})

test('comparison seek and back align both sides without restarting a completed sort', () => {
  const session = new PlaybackSession(makeDataset(12, 17, 'sorted'), 'bubble', 'quick')
  session.setComparing(true)
  session.seek(30)
  assert.equal(session.primary.getPosition(), session.primary.getTotal())
  assert.equal(session.secondary.getPosition(), 30)
  assert.equal(session.getStatus(), 'paused')
  session.back()
  assert.equal(session.secondary.getPosition(), 29)
  session.seek(5)
  assert.equal(session.primary.getPosition(), 5)
  assert.equal(session.secondary.getPosition(), 5)
  session.setSpeed(10)
  session.play()
  session.advance(50)
  session.back()
  assert.equal(session.primary.getPosition(), 5)
  assert.equal(session.secondary.getPosition(), 5)
  session.seek(0)
  assert.equal(session.getStatus(), 'ready')
})

test('algorithm, dataset, and mode changes reset both sides and preserve source values', () => {
  const input = makeDataset(8, 17, 'reversed')
  const session = new PlaybackSession(input, 'merge', 'insertion')
  session.setComparing(true)
  session.seek(5) // A merge write has overwritten a main-array value.
  assert.notDeepEqual(session.primary.getSnapshot().values, input)
  session.setAlgorithm('secondary', 'quick')
  assert.deepEqual(session.primary.getSnapshot().values, input)
  assert.deepEqual(session.secondary.getSnapshot().values, input)
  assert.equal(session.getPosition(), 0)
  session.seek(10)
  session.setComparing(false)
  assert.equal(session.getStatus(), 'ready')
  session.play()
  session.advance(100)
  assert.equal(session.secondary.getPosition(), 0)
  const fresh = makeDataset(20, 77, 'duplicates')
  session.load(fresh)
  session.setComparing(true)
  assert.deepEqual(session.primary.getSnapshot().values, fresh)
  assert.deepEqual(session.secondary.getSnapshot().values, fresh)
})

test('identical algorithms remain synchronized, including duplicates and speed changes', () => {
  const session = new PlaybackSession(makeDataset(20, 42, 'duplicates'), 'merge', 'merge')
  session.setComparing(true)
  session.setSpeed(37)
  session.play()
  for (let i = 0; i < 100; i++) {
    session.advance(13)
    if (i === 40) session.setSpeed(111)
    assert.deepEqual(session.primary.getSnapshot(), session.secondary.getSnapshot())
  }
  session.seek(session.getTotal())
  assert.equal(session.getStatus(), 'complete')
  session.reset()
  assert.deepEqual(session.primary.getSnapshot(), session.secondary.getSnapshot())
})
