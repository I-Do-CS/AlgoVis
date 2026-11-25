import type { BucketState, Item, MergeBuffer, Operation } from './types.ts'

export const MAX_COUNTING_RANGE = 1024

function integerItems(input: readonly number[]): Item[] {
  if (input.some((value) => !Number.isSafeInteger(value))) {
    throw new Error('Counting and radix sort require safe integer values.')
  }
  return input.map((value, id) => ({ value, id }))
}

/** One stable counting pass; only writes back to the main array count as writes. */
function countingPass(items: Item[], labels: readonly number[], key: (item: Item) => number, operations: Operation[], digit?: number): void {
  const counts = labels.map(() => 0)
  const state = (phase: BucketState['phase'], active: number): BucketState => ({ labels, counts: [...counts], active, phase, digit })
  if (digit !== undefined) {
    operations.push({ type: 'bucket', buckets: state('count', -1), lines: [0], message: { key: 'opDigitPass', values: { digit } } })
  }
  for (let index = 0; index < items.length; index++) {
    const bucket = key(items[index])
    counts[bucket]++
    operations.push({ type: 'bucket', index, buckets: state('count', bucket), lines: [1], message: { key: 'opCount', values: { value: items[index].value, bucket: labels[bucket], count: counts[bucket] } } })
  }
  for (let bucket = 0; bucket < counts.length; bucket++) {
    if (bucket > 0) counts[bucket] += counts[bucket - 1]
    operations.push({ type: 'bucket', buckets: state('prefix', bucket), lines: [2], message: { key: 'opPrefix', values: { bucket: labels[bucket], count: counts[bucket] } } })
  }
  const output = new Array<Item>(items.length)
  // Reading right to left preserves the identities and order of duplicate keys.
  for (let index = items.length - 1; index >= 0; index--) {
    const item = items[index]
    const bucket = key(item)
    const target = --counts[bucket]
    output[target] = item
    operations.push({ type: 'bucket', index, buckets: state('place', bucket), lines: [3], message: { key: 'opBucketPlace', values: { value: item.value, position: target + 1 } } })
  }
  const buffer: MergeBuffer = { start: 0, items: output }
  for (let index = 0; index < output.length; index++) {
    const item = output[index]
    operations.push({ type: 'write', index, item, sourceIndex: index, buffer, buckets: state('write', key(item)), lines: [4], message: { key: 'opWrite', values: { value: item.value, position: index + 1 } } })
    items[index] = item
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
  // Run one pass for zero as well. Negative inputs use a common offset.
  for (let digit = 1; digit <= Math.max(1, maximum); digit *= 10) {
    countingPass(items, labels, (item) => Math.floor((item.value - offset) / digit) % 10, operations, digit)
  }
  return operations
}
