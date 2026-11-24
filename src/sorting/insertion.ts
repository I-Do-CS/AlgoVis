export type Operation =
  | { type: 'select'; index: number }
  | { type: 'compare'; indices: readonly [number, number] }
  | { type: 'swap'; indices: readonly [number, number] }

/** Record operations, never full array snapshots. Input is never mutated. */
export function insertionTrace(input: readonly number[]): Operation[] {
  const values = [...input]
  const operations: Operation[] = []

  for (let i = 1; i < values.length; i++) {
    operations.push({ type: 'select', index: i })
    let j = i
    while (j > 0) {
      operations.push({ type: 'compare', indices: [j - 1, j] })
      if (values[j - 1] <= values[j]) break
      operations.push({ type: 'swap', indices: [j - 1, j] })
      ;[values[j - 1], values[j]] = [values[j], values[j - 1]]
      j--
    }
  }
  return operations
}

/** Reproducible Fisher–Yates shuffle, useful for replaying the same experiment. */
export function makeDataset(size: number, seed: number): number[] {
  let state = seed >>> 0
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
  const values = Array.from({ length: size }, (_, i) =>
    Math.round(10 + (i / Math.max(size - 1, 1)) * 90),
  )
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[values[i], values[j]] = [values[j], values[i]]
  }
  return values
}
