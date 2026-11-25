export type SortAlgorithmId = 'insertion' | 'bubble' | 'selection' | 'merge' | 'quick' | 'counting' | 'radix'
export type SearchAlgorithmId = 'linear' | 'binary'
export type AlgorithmId = SortAlgorithmId | SearchAlgorithmId
export type AlgorithmFamily = 'sorting' | 'searching'
export const isSearchAlgorithm = (id: AlgorithmId): id is SearchAlgorithmId => id === 'linear' || id === 'binary'
export type SearchResult = { readonly target: number; readonly index: number | null }
export type Item = { readonly id: number; readonly value: number }
export type MergeBuffer = { readonly start: number; readonly items: readonly Item[] }
export type BucketState = {
  readonly labels: readonly number[]
  readonly counts: readonly number[]
  readonly active: number
  readonly phase: 'count' | 'prefix' | 'place' | 'write'
  readonly digit?: number
}

export type NarrationKey = 'opPick' | 'opNeighbors' | 'opInsertSwap' | 'opSweep' | 'opBubbleSwap' | 'opFindMinimum' | 'opCompareMinimum' | 'opNewMinimum' | 'opPlaceMinimum' | 'opSplit' | 'opBufferCompare' | 'opWrite' | 'opPivot' | 'opPivotCompare' | 'opPartition' | 'opPlacePivot' | 'opCount' | 'opPrefix' | 'opBucketPlace' | 'opDigitPass' | 'opProbe' | 'opSearchRange' | 'opDiscardLeft' | 'opDiscardRight' | 'opFound' | 'opMiss'

interface Context {
  lines: readonly number[]
  message: { key: NarrationKey; values?: Readonly<Record<string, number>> }
  range?: readonly [number, number]
  pivotId?: number
  minimumId?: number
  buffer?: MergeBuffer
  buckets?: BucketState
}

export type Operation = Context & (
  | { type: 'select'; index: number }
  | { type: 'compare'; indices: readonly [number, number]; source?: 'buffer' }
  | { type: 'swap'; indices: readonly [number, number] }
  | { type: 'write'; index: number; item: Item; sourceIndex: number; buffer: MergeBuffer }
  | { type: 'range'; range: readonly [number, number] }
  | { type: 'bucket'; index?: number; buckets: BucketState }
  | { type: 'probe'; index: number; target: number }
  | { type: 'found'; index: number; target: number }
  | { type: 'miss'; target: number }
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
  trace: (input: readonly number[], target?: number) => Operation[]
}
