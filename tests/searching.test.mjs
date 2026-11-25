import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ALGORITHMS, SEARCH_ALGORITHM_IDS } from '../src/sorting/algorithms.ts'
import { SortPlayer } from '../src/sorting/player.ts'
import { PlaybackSession } from '../src/sorting/session.ts'
import { makeDataset } from '../src/sorting/datasets.ts'

for (const id of SEARCH_ALGORITHM_IDS) {
  test(`${id}: finds present and missing targets without changing values or identities`, () => {
    const cases = [[], [7], [1, 1, 1], [-4, 2, -4, 9, 0], [0.25, -1.5, 8.75]]
    for (const pattern of ['random', 'sorted', 'reversed', 'duplicates']) {
      for (const size of [8, 31, 96]) cases.push(makeDataset(size, 42, pattern))
    }
    for (const source of cases) {
      const input = id === 'binary' ? [...source].sort((a, b) => a - b) : source
      for (const target of [...new Set([...input, -999, 101, 0.5])]) {
        const player = new SortPlayer(input, id, target)
        const original = [...input]
        player.play(); player.advance(1_000_000)
        const result = player.getSnapshot()
        assert.equal(result.status, 'complete')
        assert.equal(result.target, target)
        assert.equal(result.searchResult.target, target)
        const first = input.indexOf(target)
        if (first === -1) assert.equal(result.searchResult.index, null)
        else if (id === 'linear') assert.equal(result.searchResult.index, first)
        else assert.equal(input[result.searchResult.index], target)
        assert.deepEqual(result.values, original)
        assert.deepEqual(input, original)
        assert.deepEqual(player.getFrame().items.map((item) => item.id), input.map((_, index) => index))
        assert.equal(result.writes, 0)
        assert.ok(result.comparisons <= (id === 'binary' ? Math.ceil(Math.log2(input.length + 1)) : input.length))
        for (const operation of ALGORITHMS[id].trace(input, target)) {
          assert.ok(operation.lines.every((line) => line >= 0 && line < ALGORITHMS[id].code.length))
          if (operation.type === 'probe') {
            assert.ok(operation.index >= operation.range[0] && operation.index <= operation.range[1])
            assert.ok(operation.index >= 0 && operation.index < input.length)
          }
        }
      }
    }
  })

  test(`${id}: seeking, pause/resume, replay and target changes restore result and counts`, () => {
    const input = Array.from({ length: 180 }, (_, i) => i * 2)
    const player = new SortPlayer(input, id, 999)
    const linear = new SortPlayer(input, id, 999)
    const expected = []
    for (let i = 0; i <= linear.getTotal(); i++) {
      expected.push(linear.getSnapshot()); linear.step()
    }
    for (const raw of [1, 64, 65, player.getTotal(), 0, 127, 3, player.getTotal()]) {
      player.seek(raw)
      const state = player.getSnapshot()
      const position = Math.min(raw, player.getTotal())
      assert.deepEqual(state.values, input)
      assert.equal(state.comparisons, expected[position].comparisons)
      assert.deepEqual(state.searchResult, expected[position].searchResult)
      assert.deepEqual(state.operation, expected[position].operation)
    }
    player.play()
    assert.equal(player.getSnapshot().searchResult, null)
    player.advance(25); player.pause()
    const paused = player.getSnapshot()
    player.advance(1000)
    assert.deepEqual(player.getSnapshot(), paused)
    player.play(); player.advance(1_000_000)
    assert.deepEqual(player.getSnapshot().searchResult, { target: 999, index: null })
    player.setTarget(0)
    assert.equal(player.getStatus(), 'ready')
    assert.equal(player.getSnapshot().searchResult, null)
    assert.equal(player.getSnapshot().comparisons, 0)
    player.seek(player.getTotal())
    assert.deepEqual(player.getSnapshot().searchResult, { target: 0, index: 0 })
    player.reset()
    assert.equal(player.getSnapshot().target, 0)
    assert.equal(player.getSnapshot().searchResult, null)
  })
}

test('search result is revealed only when its terminal operation commits', () => {
  const player = new SortPlayer([7, 8], 'linear', 7)
  player.setSpeed(10); player.play(); player.advance(150)
  assert.equal(player.getFrame().operation.type, 'found')
  assert.equal(player.getSnapshot().searchResult, null)
  assert.equal(player.getSnapshot().comparisons, 1)
  player.advance(50)
  assert.deepEqual(player.getSnapshot().searchResult, { target: 7, index: 0 })
  player.seek(1)
  assert.equal(player.getSnapshot().searchResult, null)
})

test('invalid searches are rejected without corrupting an existing playback state', () => {
  const player = new SortPlayer([1, 3, 9], 'binary', 3)
  player.step()
  const before = player.getSnapshot()
  assert.throws(() => player.load([3, 1, 2], 'binary'), /ascending/)
  assert.deepEqual(player.getSnapshot(), before)
  for (const target of [NaN, Infinity, -Infinity]) {
    assert.throws(() => player.setTarget(target), /finite/)
    assert.deepEqual(player.getSnapshot(), before)
    assert.throws(() => ALGORITHMS.linear.trace([1, 2], target), /finite/)
  }
})

test('search comparison shares a sorted copy for binary search and preserves source order', () => {
  const input = [9, 1, 7, 1, 3]
  const sorted = [...input].sort((a, b) => a - b)
  const session = new PlaybackSession(input)
  session.setFamily('searching')
  assert.equal(session.getSnapshot().family, 'searching')
  assert.equal(session.getSnapshot().sortedForSearch, false)
  assert.deepEqual(session.primary.getSnapshot().values, input)
  session.setTarget(1); session.setComparing(true)
  assert.equal(session.getSnapshot().sortedForSearch, true)
  assert.deepEqual(session.primary.getSnapshot().values, sorted)
  assert.deepEqual(session.secondary.getSnapshot().values, sorted)
  assert.deepEqual(session.getOriginalValues(), input)
  session.setSpeed(10); session.play(); session.advance(250)
  assert.equal(session.primary.getPosition(), 2)
  const held = session.primary.getSnapshot()
  session.pause(); session.play(); session.advance(100)
  assert.deepEqual(session.primary.getSnapshot(), held)
  session.seek(session.getTotal())
  assert.equal(session.getStatus(), 'complete')
  assert.equal(session.primary.getSnapshot().searchResult.index, 0)
  assert.equal(sorted[session.secondary.getSnapshot().searchResult.index], 1)
  session.seek(0)
  assert.equal(session.primary.getSnapshot().searchResult, null)
  assert.equal(session.secondary.getSnapshot().searchResult, null)
  session.setComparing(false)
  assert.deepEqual(session.primary.getSnapshot().values, input)
  session.setAlgorithm('primary', 'binary')
  assert.deepEqual(session.primary.getSnapshot().values, sorted)
  session.load([3, 2, 1])
  assert.deepEqual(session.primary.getSnapshot().values, [1, 2, 3])
  session.setFamily('sorting')
  assert.deepEqual(session.primary.getSnapshot().values, [3, 2, 1])
  assert.equal(session.getSnapshot().family, 'sorting')
  assert.equal(session.primary.getSnapshot().target, null)
})
