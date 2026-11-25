import type { BucketState, Item, MergeBuffer, Operation, RadixPass } from './types.ts'

export const MAX_COUNTING_RANGE = 1024

function integerItems(input: readonly number[]): Item[] {
  if (input.some((value) => !Number.isSafeInteger(value))) {
    throw new Error('Counting and radix sort require safe integer values.')
  }
  return input.map((value, id) => ({ value, id }))
}

/** One stable counting pass; only writes back to the main array count as writes. */
function countingPass(items: Item[], labels: readonly number[], key: (item: Item) => number, operations: Operation[], radix?: RadixPass): void {
  const counts = labels.map(() => 0)
  let output: readonly (Item | null)[] = items.map(() => null)
  const state = (phase: BucketState['phase'], active: number, item?: Item, outputIndex?: number): BucketState => ({
    labels, counts: [...counts], active, phase, radix, output, outputIndex,
    source: item ? { value: item.value, key: item.value + (radix?.offset ?? 0) } : undefined,
  })
  if (radix) {
    operations.push({ type: 'bucket', buckets: state('count', -1), lines: [0], message: { key: 'opDigitPass', values: { digit: radix.digit, pass: radix.index, total: radix.total } } })
  }
  for (let index = 0; index < items.length; index++) {
    const bucket = key(items[index])
    counts[bucket]++
    const item = items[index]
    operations.push({ type: 'bucket', index, buckets: state('count', bucket, item), lines: [1], message: radix
      ? { key: 'opRadixCount', values: { value: item.value, key: item.value + radix.offset, digit: radix.digit, bucket, count: counts[bucket] } }
      : { key: 'opCount', values: { value: item.value, bucket: labels[bucket], count: counts[bucket] } } })
  }
  for (let bucket = 0; bucket < counts.length; bucket++) {
    if (bucket > 0) counts[bucket] += counts[bucket - 1]
    operations.push({ type: 'bucket', buckets: state('prefix', bucket), lines: [2], message: { key: 'opPrefix', values: { bucket: labels[bucket], count: counts[bucket] } } })
  }
  // Reading right to left preserves the identities and order of duplicate keys.
  for (let index = items.length - 1; index >= 0; index--) {
    const item = items[index]
    const bucket = key(item)
    const target = --counts[bucket]
    // Keep each partial output immutable so pause and reverse seeking show its real contents.
    const next = [...output]
    next[target] = item
    output = next
    operations.push({ type: 'bucket', index, buckets: state('place', bucket, item, target), lines: [3], message: { key: 'opBucketPlace', values: { value: item.value, position: target + 1 } } })
  }
  // All positions have now been filled once by the stable counting pass.
  const buffer: MergeBuffer = { start: 0, items: output.map((item) => item!) }
  for (let index = 0; index < buffer.items.length; index++) {
    const item = buffer.items[index]
    operations.push({ type: 'write', index, item, sourceIndex: index, buffer, buckets: state('write', key(item), item, index), lines: [4], message: { key: 'opWrite', values: { value: item.value, position: index + 1 } } })
    items[index] = item
  }
  if (radix) {
    operations.push({ type: 'bucket', buckets: state('pass-complete', -1), buffer, lines: [5], message: { key: 'opPassComplete', values: { pass: radix.index, total: radix.total, digit: radix.digit } } })
  }
}

export function countingTrace(input: readonly number[]): Operation[] {
  const items = integerItems(input)
  if (items.length < 2) return []
  const minimum = Math.min(...input)
  const range = Math.max(...input) - minimum + 1
  if (!Number.isSafeInteger(range) || range > MAX_COUNTING_RANGE) {
    throw new Error(`Counting sort supports a value range of at most ${MAX_COUNTING_RANGE}.`)
  }
  const operations: Operation[] = []
  countingPass(items, Array.from({ length: range }, (_, index) => minimum + index), (item) => item.value - minimum, operations)
  return operations
}

export function radixTrace(input: readonly number[]): Operation[] {
  const items = integerItems(input)
  if (items.length < 2) return []
  const offset = Math.min(0, ...input)
  const maximum = Math.max(...input) - offset
  if (!Number.isSafeInteger(maximum)) throw new Error('Radix sort requires a safe integer key range.')
  const operations: Operation[] = []
  const labels = Array.from({ length: 10 }, (_, digit) => digit)
  const places: number[] = []
  // Run one pass for zero as well. Negative inputs use a common offset.
  for (let digit = 1; digit <= Math.max(1, maximum); digit *= 10) {
    places.push(digit)
  }
  for (const [index, digit] of places.entries()) {
    countingPass(items, labels, (item) => Math.floor((item.value - offset) / digit) % 10, operations, { digit, index: index + 1, total: places.length, offset: -offset })
  }
  return operations
}
