export const DATASETS = [
  { id: 'random', name: 'Random' },
  { id: 'sorted', name: 'Sorted' },
  { id: 'reversed', name: 'Reversed' },
  { id: 'nearly-sorted', name: 'Nearly sorted' },
  { id: 'duplicates', name: 'Many duplicates' },
] as const

export type DatasetId = typeof DATASETS[number]['id']

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/** Return a reproducible permutation without changing the supplied multiset. */
export function shuffleValues(input: readonly number[], seed: number): number[] {
  const random = seededRandom(seed)
  const values = [...input]
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[values[i], values[j]] = [values[j], values[i]]
  }
  return values
}

export function makeDataset(size: number, seed: number, pattern: DatasetId = 'random'): number[] {
  const values = Array.from({ length: size }, (_, i) =>
    Math.round(10 + (i / Math.max(size - 1, 1)) * 90),
  )
  switch (pattern) {
    case 'sorted': return values
    case 'reversed': return values.reverse()
    case 'duplicates': return shuffleValues(values.map((_, i) => [18, 38, 58, 78, 98][i % 5]), seed)
    case 'nearly-sorted': {
      // Spread a small number of disjoint neighbor swaps through the array.
      const pairs = shuffleValues(Array.from({ length: Math.floor(size / 2) }, (_, i) => i * 2), seed)
      for (const i of pairs.slice(0, Math.max(1, Math.floor(size * 0.08)))) {
        [values[i], values[i + 1]] = [values[i + 1], values[i]]
      }
      return values
    }
    case 'random': return shuffleValues(values, seed)
  }
}
