export type AlgorithmId = 'insertion' | 'bubble' | 'selection' | 'merge' | 'quick'
export type Item = { readonly id: number; readonly value: number }
export type MergeBuffer = { readonly start: number; readonly items: readonly Item[] }

export type NarrationKey = 'opPick' | 'opNeighbors' | 'opInsertSwap' | 'opSweep' | 'opBubbleSwap' | 'opFindMinimum' | 'opCompareMinimum' | 'opNewMinimum' | 'opPlaceMinimum' | 'opSplit' | 'opBufferCompare' | 'opWrite' | 'opPivot' | 'opPivotCompare' | 'opPartition' | 'opPlacePivot'

interface Context {
  lines: readonly number[]
  message: { key: NarrationKey; values?: Readonly<Record<string, number>> }
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
