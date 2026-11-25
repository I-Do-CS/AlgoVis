import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ALGORITHMS } from '../src/sorting/algorithms.ts'
import { SortPlayer } from '../src/sorting/player.ts'

test('counting sort records counts, prefix positions and stable output without pair comparisons', () => {
  const player = new SortPlayer([3, 1, 2, 1], 'counting')
  player.seek(player.getTotal())
  assert.deepEqual(player.getSnapshot().values, [1, 1, 2, 3])
  assert.deepEqual(player.getFrame().items.map((item) => item.id), [1, 3, 2, 0])
  assert.equal(player.getSnapshot().comparisons, 0)
  assert.equal(player.getSnapshot().writes, 4)
  const trace = ALGORITHMS.counting.trace([3, 1, 2, 1])
  assert.deepEqual(trace[3].buckets.counts, [2, 1, 1])
  assert.deepEqual(trace[6].buckets.counts, [2, 3, 4])
  assert.deepEqual(trace[0].buckets.counts, [0, 0, 1], 'later updates must not alter earlier bucket states')
})

test('radix performs complete stable units, tens and hundreds passes', () => {
  const input = [170, 45, 75, 90, 802, 24, 2, 66, 45]
  const player = new SortPlayer(input, 'radix')
  let passes = 0
  while (player.getStatus() !== 'complete') {
    player.step()
    const snapshot = player.getSnapshot()
    if (snapshot.operation.type === 'write' && snapshot.writes % input.length === 0) {
      passes++
      const expected = input.map((value, id) => ({ value, id })).sort((a, b) => a.value % 10 ** passes - b.value % 10 ** passes)
      assert.deepEqual(player.getFrame().items, expected)
    }
  }
  assert.equal(passes, 3)
  assert.equal(player.getSnapshot().writes, input.length * 3)
  assert.equal(player.getSnapshot().comparisons, 0)
})

test('distribution sorts reject unsupported inputs and retain valid signed-integer support', () => {
  for (const id of ['counting', 'radix']) {
    for (const input of [[0.5, 1], [Number.MAX_SAFE_INTEGER + 1], [NaN]]) {
      assert.throws(() => new SortPlayer(input, id))
    }
    const player = new SortPlayer([-15, 0, -100, 15, -15, 2], id)
    player.seek(player.getTotal())
    assert.deepEqual(player.getSnapshot().values, [-100, -15, -15, 0, 2, 15])
  }
  assert.throws(() => new SortPlayer([0, 1024], 'counting'), /range/)
  assert.throws(() => new SortPlayer([-Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER], 'radix'), /range/)
})

test('distribution output fills incrementally without changing input or earlier output states', () => {
  for (const id of ['counting', 'radix']) {
    const input = [10, 23, 36, 49, 61, 74, 87, 100]
    const trace = ALGORITHMS[id].trace(input)
    const firstWrite = trace.findIndex((operation) => operation.type === 'write')
    const placements = trace.slice(0, firstWrite).filter((operation) => operation.buckets.phase === 'place')
    const player = new SortPlayer(input, id)
    for (let i = 0; i < placements.length; i++) {
      const operation = placements[i]
      const output = operation.buckets.output.filter((item) => item !== null)
      assert.equal(output.length, i + 1)
      assert.equal(new Set(output.map((item) => item.id)).size, i + 1)
      assert.equal(operation.buckets.output[operation.buckets.outputIndex].value, input[operation.index])
      player.seek(trace.indexOf(operation) + 1)
      assert.deepEqual(player.getSnapshot().values, input)
      assert.deepEqual(player.getSnapshot().operation.buckets.output, operation.buckets.output)
    }
    assert.equal(placements[0].buckets.output.filter((item) => item !== null).length, 1, 'future placements must not fill past snapshots')
    assert.equal(trace[0].buckets.output.filter((item) => item !== null).length, 0)
    assert.ok(trace[firstWrite].buckets.output.every((item) => item !== null))
    player.seek(firstWrite + 2)
    player.seek(trace.indexOf(placements[0]) + 1)
    assert.equal(player.getSnapshot().operation.buckets.output.filter((item) => item !== null).length, 1)
  }
})

test('radix pass boundaries reset output and retain stable digit order through reverse seeking', () => {
  const input = [10, 23, 36, 49, 61, 74, 87, 100]
  const trace = ALGORITHMS.radix.trace(input)
  const player = new SortPlayer(input, 'radix')
  const endings = trace.flatMap((op, index) => op.buckets.phase === 'pass-complete' ? [index] : [])
  assert.equal(endings.length, 3)
  for (const [index, end] of endings.entries()) {
    player.seek(end + 1)
    const expected = input.map((value, id) => ({ value, id })).sort((a, b) => a.value % 10 ** (index + 1) - b.value % 10 ** (index + 1))
    assert.deepEqual(player.getFrame().items, expected)
    assert.deepEqual(player.getSnapshot().operation.buckets.output, expected)
    assert.equal(player.getSnapshot().operation.buckets.radix.index, index + 1)
    assert.equal(player.getSnapshot().operation.buckets.radix.total, 3)
    if (index < 2) {
      assert.equal(player.getStatus(), 'paused', 'an intermediate pass is not a finished sort')
      player.step()
      assert.equal(player.getSnapshot().operation.buckets.radix.index, index + 2)
      assert.ok(player.getSnapshot().operation.buckets.output.every((item) => item === null))
      player.seek(end + 1)
      assert.deepEqual(player.getSnapshot().operation.buckets.output, expected)
    }
  }
  assert.equal(player.getStatus(), 'complete')
  player.reset()
  assert.deepEqual(player.getSnapshot().values, input)
  assert.equal(player.getSnapshot().operation, null)
})

test('radix sorts zero, signed and safe-integer boundary keys against an exact per-pass oracle', () => {
  for (const input of [[0, 0, 0], [1000, 100, 10, 1, 0, 100], [Number.MAX_SAFE_INTEGER, 0, Number.MAX_SAFE_INTEGER - 1], [-Number.MAX_SAFE_INTEGER, -1, -Number.MAX_SAFE_INTEGER + 1, 0]]) {
    const offset = -Math.min(0, ...input)
    const player = new SortPlayer(input, 'radix')
    while (player.getStatus() !== 'complete') {
      player.step()
      const operation = player.getSnapshot().operation
      if (operation.buckets.phase !== 'pass-complete') continue
      const modulus = BigInt(operation.buckets.radix.digit) * 10n
      const expected = input.map((value, id) => ({ value, id })).sort((a, b) => {
        const left = (BigInt(a.value) + BigInt(offset)) % modulus
        const right = (BigInt(b.value) + BigInt(offset)) % modulus
        return left < right ? -1 : left > right ? 1 : 0
      })
      assert.deepEqual(player.getFrame().items, expected)
    }
    assert.deepEqual(player.getSnapshot().values, [...input].sort((a, b) => a - b))
  }
})

test('a paused radix copy keeps the value in its output slot until the main-array write commits', () => {
  const input = [23, 10]
  const trace = ALGORITHMS.radix.trace(input)
  const firstWrite = trace.findIndex((op) => op.type === 'write')
  const player = new SortPlayer(input, 'radix')
  player.seek(firstWrite)
  player.setSpeed(10); player.play(); player.advance(50); player.pause()
  const frame = player.getFrame()
  assert.equal(frame.writeTransition.progress, 0.5)
  assert.equal(frame.writeTransition.to.value, 10)
  assert.equal(frame.operation.buckets.output[0].value, 10)
  assert.deepEqual(player.getSnapshot().values, input)
  const paused = player.getSnapshot()
  player.advance(1000)
  assert.deepEqual(player.getSnapshot(), paused)
  player.step()
  assert.equal(player.getSnapshot().writes, 1)
  assert.deepEqual(player.getSnapshot().values, [10, 10])
  assert.deepEqual(player.getSnapshot().operation.buckets.output.map((item) => item.value), [10, 23])
})
