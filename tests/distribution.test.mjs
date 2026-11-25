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
