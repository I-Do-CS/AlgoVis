import { insertionTrace } from './insertion.ts'
import { countingTrace, radixTrace } from './distribution.ts'
import { binaryTrace, linearTrace } from '../searching/algorithms.ts'
import type { Algorithm, AlgorithmId, Item, MergeBuffer, Operation, SearchAlgorithmId, SortAlgorithmId } from './types.ts'

function bubbleTrace(input: readonly number[]): Operation[] {
  const values = [...input]
  const operations: Operation[] = []
  for (let end = values.length - 1; end > 0; end--) {
    const range = [0, end] as const
    operations.push({ type: 'select', index: 0, range, lines: [0, 1], message: { key: 'opSweep', values: { count: end + 1 } } })
    let swapped = false
    for (let j = 0; j < end; j++) {
      operations.push({ type: 'compare', indices: [j, j + 1], range, lines: [2, 3], message: { key: 'opNeighbors', values: { a: j + 1, b: j + 2 } } })
      if (values[j] > values[j + 1]) {
        operations.push({ type: 'swap', indices: [j, j + 1], range, lines: [4, 5], message: { key: 'opBubbleSwap' } })
        ;[values[j], values[j + 1]] = [values[j + 1], values[j]]
        swapped = true
      }
    }
    if (!swapped) break
  }
  return operations
}

function selectionTrace(input: readonly number[]): Operation[] {
  const items = input.map((value, id) => ({ value, id }))
  const operations: Operation[] = []
  for (let start = 0; start < items.length - 1; start++) {
    const range = [start, items.length - 1] as const
    let min = start
    operations.push({ type: 'select', index: min, minimumId: items[min].id, range, lines: [0, 1], message: { key: 'opFindMinimum', values: { position: start + 1 } } })
    for (let j = start + 1; j < items.length; j++) {
      operations.push({ type: 'compare', indices: [min, j], minimumId: items[min].id, range, lines: [2], message: { key: 'opCompareMinimum', values: { value: items[j].value, minimum: items[min].value } } })
      if (items[j].value < items[min].value) {
        min = j
        operations.push({ type: 'select', index: min, minimumId: items[min].id, range, lines: [2], message: { key: 'opNewMinimum', values: { value: items[min].value } } })
      }
    }
    if (min !== start) {
      operations.push({ type: 'swap', indices: [start, min], minimumId: items[min].id, range, lines: [3], message: { key: 'opPlaceMinimum', values: { value: items[min].value, position: start + 1 } } })
      ;[items[start], items[min]] = [items[min], items[start]]
    }
  }
  return operations
}

function mergeTrace(input: readonly number[]): Operation[] {
  const items: Item[] = input.map((value, id) => ({ value, id }))
  const operations: Operation[] = []
  const sort = (lo: number, hi: number): void => {
    if (lo >= hi) return
    const range = [lo, hi] as const
    const mid = Math.floor((lo + hi) / 2)
    operations.push({ type: 'range', range, lines: [0], message: { key: 'opSplit', values: { a: lo + 1, b: hi + 1 } } })
    sort(lo, mid)
    sort(mid + 1, hi)
    // Immutable buffer references are shared by this merge's events, never recopied per event.
    const buffer: MergeBuffer = { start: lo, items: items.slice(lo, hi + 1) }
    let left = 0
    let right = mid - lo + 1
    const leftEnd = right
    for (let target = lo; target <= hi; target++) {
      let source: number
      if (left < leftEnd && right < buffer.items.length) {
        operations.push({ type: 'compare', indices: [lo + left, lo + right], source: 'buffer', buffer, range, lines: [3], message: { key: 'opBufferCompare', values: { a: buffer.items[left].value, b: buffer.items[right].value } } })
        source = buffer.items[left].value <= buffer.items[right].value ? left++ : right++
      } else {
        source = left < leftEnd ? left++ : right++
      }
      const item = buffer.items[source]
      operations.push({ type: 'write', index: target, item, sourceIndex: lo + source, buffer, range, lines: [4], message: { key: 'opWrite', values: { value: item.value, position: target + 1 } } })
      items[target] = item
    }
  }
  sort(0, items.length - 1)
  return operations
}

function quickTrace(input: readonly number[]): Operation[] {
  const items = input.map((value, id) => ({ value, id }))
  const operations: Operation[] = []
  const sort = (low: number, high: number): void => {
    // Recurse on the smaller side and iterate over the larger side to bound stack space.
    while (low < high) {
      const pivot = items[high]
      const range = [low, high] as const
      const context = { range, pivotId: pivot.id }
      operations.push({ type: 'select', index: high, ...context, lines: [0], message: { key: 'opPivot', values: { value: pivot.value, position: high + 1 } } })
      let boundary = low
      for (let scan = low; scan < high; scan++) {
        operations.push({ type: 'compare', indices: [scan, high], ...context, lines: [1, 2], message: { key: 'opPivotCompare', values: { value: items[scan].value, pivot: pivot.value } } })
        if (items[scan].value <= pivot.value) {
          if (boundary !== scan) {
            operations.push({ type: 'swap', indices: [boundary, scan], ...context, lines: [3], message: { key: 'opPartition', values: { value: items[scan].value } } })
            ;[items[boundary], items[scan]] = [items[scan], items[boundary]]
          }
          boundary++
        }
      }
      if (boundary !== high) {
        operations.push({ type: 'swap', indices: [boundary, high], ...context, lines: [4], message: { key: 'opPlacePivot', values: { value: pivot.value } } })
        ;[items[boundary], items[high]] = [items[high], items[boundary]]
      }
      if (boundary - low < high - boundary) {
        sort(low, boundary - 1)
        low = boundary + 1
      } else {
        sort(boundary + 1, high)
        high = boundary - 1
      }
    }
  }
  sort(0, items.length - 1)
  return operations
}

export const ALGORITHM_IDS: readonly SortAlgorithmId[] = ['insertion', 'bubble', 'selection', 'merge', 'quick', 'counting', 'radix']
export const SEARCH_ALGORITHM_IDS: readonly SearchAlgorithmId[] = ['linear', 'binary']
export const ALL_ALGORITHM_IDS: readonly AlgorithmId[] = [...ALGORITHM_IDS, ...SEARCH_ALGORITHM_IDS]
export const ALGORITHMS: Record<AlgorithmId, Algorithm> = {
  insertion: {
    id: 'insertion', name: 'Insertion sort', description: 'Like sorting a hand of cards. Pick an element, move it left until it fits, and repeat.',
    tags: ['Comparison sort', 'Stable', 'In-place'], best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
    code: ['for i = 1 … n − 1', '  j = i', '  while j > 0 and a[j−1] > a[j]', '    swap(a[j−1], a[j])', '    j = j − 1'],
    note: 'Uses adjacent swaps. Each swap counts as two array writes.', trace: insertionTrace,
  },
  bubble: {
    id: 'bubble', name: 'Bubble sort', description: 'Compare neighbors and swap them when they are out of order. Each pass carries a larger value to the right.',
    tags: ['Comparison sort', 'Stable', 'In-place'], best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
    code: ['for end = n − 1 … 1', '  swapped = false', '  for j = 0 … end − 1', '    if a[j] > a[j+1]', '      swap(a[j], a[j+1])', '      swapped = true', '  if not swapped: stop'],
    note: 'Stops early when a pass makes no swaps. Each swap counts as two array writes.', trace: bubbleTrace,
  },
  selection: {
    id: 'selection', name: 'Selection sort', description: 'Search for the smallest remaining element, then put it at the front. Grow the sorted portion one choice at a time.',
    tags: ['Comparison sort', 'Unstable', 'In-place'], best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)',
    code: ['for start = 0 … n − 2', '  min = start', '  scan for a smaller value', '  swap(a[start], a[min])'],
    note: 'Purple marks the current minimum. Skips swaps when the minimum is already in place.', trace: selectionTrace,
  },
  merge: {
    id: 'merge', name: 'Merge sort', description: 'Split the array into smaller runs, then weave them back together in order. The auxiliary buffer keeps each merge safe.',
    tags: ['Divide and conquer', 'Stable', 'Auxiliary buffer'], best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)',
    code: ['split the range into two halves', 'sort the left and right halves', 'copy both runs into a buffer', 'compare next buffered values', 'write smaller value to array', 'repeat until buffer is empty'],
    note: 'Gold marks buffer comparisons; pink marks a write. Writes count placements into the main array, excluding buffer copies.', trace: mergeTrace,
  },
  quick: {
    id: 'quick', name: 'Quicksort', description: 'Choose a pivot and move smaller values to its left. Put the pivot in place, then partition each remaining side.',
    tags: ['Partitioning', 'Unstable', 'In-place'], best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)',
    code: ['choose the last element as pivot', 'scan the current range', '  if value ≤ pivot', '    swap into the left partition', 'place pivot between partitions', 'repeat for both partitions'],
    note: 'Purple follows the pivot. A last-element pivot makes sorted and all-equal inputs worst cases.', trace: quickTrace,
  },
  counting: {
    id: 'counting', name: 'Counting sort', description: 'Count each integer value, turn the counts into output positions, then place the elements in order without comparing pairs.',
    tags: ['Distribution sort', 'Stable', 'Auxiliary buffer'], best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)', space: 'O(n + k)',
    code: ['find minimum and value range k', 'count each value in its bucket', 'accumulate bucket counts', 'place items right to left in output', 'copy output back to the array'],
    note: 'k is the integer value range. Supports signed integers with k ≤ 1024. Only main-array placements count as writes; bucket updates and buffer placements are visual steps.', trace: countingTrace,
  },
  radix: {
    id: 'radix', name: 'Radix sort', description: 'Sort integers one decimal digit at a time, starting with the units. Stable counting passes preserve the work of earlier digits.',
    tags: ['Distribution sort', 'Stable', 'Digit passes'], best: 'O(d(n + b))', average: 'O(d(n + b))', worst: 'O(d(n + b))', space: 'O(n + b)',
    code: ['for each digit, from units upward', 'count items in digit buckets 0 … 9', 'accumulate bucket counts', 'place items right to left in output', 'copy output back to the array', 'continue to the next digit'],
    note: 'd is the number of digits and b = 10. Intermediate passes order digit keys, so values may look numerically unsorted until the final pass. Negative integers use a shared offset. Only writes to the main array count as writes.', trace: radixTrace,
  },
  linear: {
    id: 'linear', name: 'Linear search', description: 'Check one value at a time from left to right. Stop at the first match, or finish after every element has been checked.',
    tags: ['Sequential search', 'Unsorted input', 'Read-only'], best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)',
    code: ['for i = 0 … n − 1', '  compare a[i] with target', '  if equal: return i', 'return not found'],
    note: 'Works in any input order and returns the first match. One comparison counts one value-to-target probe. Displayed positions start at 1; the array is never changed.', trace: linearTrace,
  },
  binary: {
    id: 'binary', name: 'Binary search', description: 'Probe the middle of an ascending array. Discard the half that cannot contain the target, then repeat within the remaining range.',
    tags: ['Interval search', 'Sorted input', 'Read-only'], best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)',
    code: ['low = 0; high = n − 1', 'while low ≤ high', '  mid = floor((low + high) / 2)', '  compare a[mid] with target', '  if equal: return mid', '  if a[mid] < target: low = mid + 1', '  else: high = mid − 1', 'return not found'],
    note: 'Requires ascending input; the app prepares and labels a sorted copy before playback. Preparation is excluded from search counts. May return any matching duplicate. Displayed positions start at 1.', trace: binaryTrace,
  },
}
