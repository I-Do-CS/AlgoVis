export type AlgorithmId = 'insertion' | 'bubble' | 'selection' | 'merge' | 'quick'
export type Item = { id: number; value: number }
export type MergeBuffer = { start: number; items: readonly Item[] }

interface Context {
  lines: readonly number[]
  message: string
  range?: readonly [number, number]
  pivotId?: number
  minimumId?: number
  buffer?: MergeBuffer
}

export type Operation = Context & (
  | { type: 'select'; index: number }
  | { type: 'compare'; indices: readonly [number, number]; source?: 'buffer' }
  | { type: 'swap'; indices: readonly [number, number] }
  | { type: 'write'; index: number; item: Item; sourceIndex: number; buffer: MergeBuffer }
  | { type: 'range'; range: readonly [number, number] }
)

export interface Algorithm {
  id: AlgorithmId
  name: string
  description: string
  tags: readonly string[]
  best: string
  average: string
  worst: string
  space: string
  code: readonly string[]
  note: string
  trace: (input: readonly number[]) => Operation[]
}
