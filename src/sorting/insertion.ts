import type { Operation } from './types.ts'

/** Record operations, never full array snapshots. Input is never mutated. */
export function insertionTrace(input: readonly number[]): Operation[] {
  const values = [...input]
  const operations: Operation[] = []

  for (let i = 1; i < values.length; i++) {
    operations.push({ type: 'select', index: i, lines: [0, 1], message: `Pick the next element at position ${i + 1}.` })
    let j = i
    while (j > 0) {
      operations.push({ type: 'compare', indices: [j - 1, j], lines: [2], message: `Compare neighbors at positions ${j} and ${j + 1}.` })
      if (values[j - 1] <= values[j]) break
      operations.push({ type: 'swap', indices: [j - 1, j], lines: [3, 4], message: 'Move the smaller element one position to the left.' })
      ;[values[j - 1], values[j]] = [values[j], values[j - 1]]
      j--
    }
  }
  return operations
}
