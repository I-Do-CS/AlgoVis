import { ALGORITHMS } from './algorithms.ts'
import type { AlgorithmId, Item, Operation } from './types.ts'

export type Status = 'ready' | 'playing' | 'paused' | 'complete'

export interface Snapshot {
  algorithm: AlgorithmId
  status: Status
  comparisons: number
  writes: number
  completed: number
  position: number
  total: number
  progress: number
  elapsedMs: number
  operation: Operation | null
  values: number[]
}

interface Checkpoint {
  cursor: number
  items: readonly Item[]
  comparisons: number
  writes: number
}

const CHECKPOINT_INTERVAL = 64

function applyOperation(items: Item[], operation: Operation): void {
  if (operation.type === 'swap') {
    const [a, b] = operation.indices
    ;[items[a], items[b]] = [items[b], items[a]]
  }
  if (operation.type === 'write') items[operation.index] = operation.item
}

const writeCount = (operation: Operation): number => operation.type === 'swap' ? 2 : operation.type === 'write' ? 1 : 0

export interface Frame {
  algorithm: AlgorithmId
  items: readonly Item[]
  status: Status
  operation: Operation | null
  transition: { indices: readonly [number, number]; progress: number } | null
  writeTransition: { index: number; from: Item; to: Item; progress: number } | null
}

/** Pure playback model. A browser clock supplies elapsed time; no timers live here. */
export class SortPlayer {
  private original: number[] = []
  private items: Item[] = []
  private operations: Operation[] = []
  private cursor = 0
  private phase = 0
  private comparisons = 0
  private writes = 0
  private elapsedMs = 0
  private status: Status = 'ready'
  private lastOperation: Operation | null = null
  private speed = 24
  private algorithm: AlgorithmId = 'insertion'
  private checkpoints: Checkpoint[] = []

  constructor(values: readonly number[], algorithm: AlgorithmId = 'insertion') {
    this.load(values, algorithm)
  }

  load(values: readonly number[], algorithm: AlgorithmId = this.algorithm): void {
    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error('Every array value must be a finite number.')
    }
    this.original = [...values]
    this.algorithm = algorithm
    this.items = values.map((value, id) => ({ value, id }))
    this.operations = ALGORITHMS[algorithm].trace(values)
    this.buildCheckpoints()
    this.cursor = 0
    this.phase = 0
    this.comparisons = 0
    this.writes = 0
    this.elapsedMs = 0
    this.lastOperation = null
    this.status = 'ready'
  }

  reset(): void {
    this.load(this.original)
  }

  setAlgorithm(algorithm: AlgorithmId): void {
    this.load(this.original, algorithm)
  }

  getOriginalValues(): number[] {
    return [...this.original]
  }

  getStatus(): Status { return this.status }
  getPosition(): number { return this.cursor + this.phase }
  getTotal(): number { return this.operations.length }

  private buildCheckpoints(): void {
    const items = [...this.items]
    let comparisons = 0
    let writes = 0
    this.checkpoints = [{ cursor: 0, items: [...items], comparisons, writes }]
    for (let i = 0; i < this.operations.length; i++) {
      const operation = this.operations[i]
      applyOperation(items, operation)
      if (operation.type === 'compare') comparisons++
      writes += writeCount(operation)
      if ((i + 1) % CHECKPOINT_INTERVAL === 0) {
        this.checkpoints.push({ cursor: i + 1, items: [...items], comparisons, writes })
      }
    }
  }

  /** Restore the closest checkpoint, then replay at most 63 operations. */
  seek(position: number): void {
    if (!Number.isFinite(position)) throw new Error('Timeline position must be finite.')
    const target = Math.max(0, Math.min(Math.round(position), this.operations.length))
    const checkpoint = this.checkpoints[Math.floor(target / CHECKPOINT_INTERVAL)]
    this.items = [...checkpoint.items]
    this.cursor = checkpoint.cursor
    this.comparisons = checkpoint.comparisons
    this.writes = checkpoint.writes
    this.lastOperation = this.operations[this.cursor - 1] ?? null
    this.phase = 0
    this.elapsedMs = 0
    while (this.cursor < target) this.commit()
    this.status = target === 0 ? 'ready' : target === this.operations.length ? 'complete' : 'paused'
  }

  play(): void {
    if (this.status === 'complete') this.reset()
    this.status = this.operations.length ? 'playing' : 'complete'
  }

  pause(): void {
    if (this.status === 'playing') this.status = 'paused'
  }

  setSpeed(operationsPerSecond: number): void {
    if (!Number.isFinite(operationsPerSecond) || operationsPerSecond <= 0) {
      throw new Error('Playback speed must be a positive finite number.')
    }
    this.speed = operationsPerSecond
  }

  step(): void {
    if (this.status === 'complete') return
    this.pause()
    if (this.cursor < this.operations.length) this.commit()
    this.phase = 0
    this.status = this.cursor === this.operations.length ? 'complete' : 'paused'
  }

  advance(deltaMs: number): void {
    if (this.status !== 'playing' || !Number.isFinite(deltaMs) || deltaMs <= 0) return
    const remaining = this.operations.length - this.cursor - this.phase
    const amount = Math.min((deltaMs * this.speed) / 1000, remaining)
    this.elapsedMs += (amount / this.speed) * 1000
    this.phase += amount
    while (this.phase >= 1 && this.cursor < this.operations.length) {
      this.phase -= 1
      this.commit()
    }
    if (this.cursor === this.operations.length) {
      this.phase = 0
      this.status = 'complete'
    }
  }

  private commit(): void {
    const operation = this.operations[this.cursor++]
    this.lastOperation = operation
    if (operation.type === 'compare') this.comparisons++
    applyOperation(this.items, operation)
    this.writes += writeCount(operation)
  }

  getFrame(): Frame {
    const pending = this.operations[this.cursor]
    const animating = this.phase > 0 || this.status === 'playing'
    return {
      algorithm: this.algorithm,
      items: this.items,
      status: this.status,
      operation: animating ? pending ?? this.lastOperation : this.lastOperation,
      transition: pending?.type === 'swap' && this.phase > 0
        ? { indices: pending.indices, progress: this.phase }
        : null,
      writeTransition: pending?.type === 'write' && this.phase > 0
        ? { index: pending.index, from: this.items[pending.index], to: pending.item, progress: this.phase }
        : null,
    }
  }

  getSnapshot(): Snapshot {
    return {
      algorithm: this.algorithm,
      status: this.status,
      comparisons: this.comparisons,
      writes: this.writes,
      completed: this.cursor,
      position: this.getPosition(),
      total: this.operations.length,
      progress: this.operations.length
        ? (this.cursor + this.phase) / this.operations.length
        : this.status === 'complete' ? 1 : 0,
      elapsedMs: this.elapsedMs,
      operation: this.getFrame().operation,
      values: this.items.map((item) => item.value),
    }
  }
}
