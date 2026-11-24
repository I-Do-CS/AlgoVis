import { SortPlayer, type Snapshot, type Status } from './player.ts'
import type { AlgorithmId } from './types.ts'

export type Side = 'primary' | 'secondary'

export interface SessionSnapshot {
  primary: Snapshot
  secondary: Snapshot
  comparing: boolean
  status: Status
  position: number
  total: number
  progress: number
  elapsedMs: number
}

/** One clock and input for either a single sort or a synchronized comparison. */
export class PlaybackSession {
  readonly primary: SortPlayer
  readonly secondary: SortPlayer
  private comparing = false

  constructor(values: readonly number[], primary: AlgorithmId = 'insertion', secondary: AlgorithmId = 'merge') {
    this.primary = new SortPlayer(values, primary)
    this.secondary = new SortPlayer(values, secondary)
  }

  private active(): readonly SortPlayer[] {
    return this.comparing ? [this.primary, this.secondary] : [this.primary]
  }

  getStatus(): Status {
    const players = this.active()
    if (players.some((player) => player.getStatus() === 'playing')) return 'playing'
    if (players.every((player) => player.getStatus() === 'complete')) return 'complete'
    if (players.some((player) => player.getStatus() === 'paused')) return 'paused'
    return 'ready'
  }

  getPosition(): number { return Math.max(...this.active().map((player) => player.getPosition())) }
  getTotal(): number { return Math.max(...this.active().map((player) => player.getTotal())) }
  getOriginalValues(): number[] { return this.primary.getOriginalValues() }

  load(values: readonly number[]): void {
    this.primary.load(values)
    this.secondary.load(values)
  }

  setComparing(comparing: boolean): void {
    if (this.comparing === comparing) return
    this.comparing = comparing
    this.reset()
  }

  setAlgorithm(side: Side, algorithm: AlgorithmId): void {
    this[side].setAlgorithm(algorithm)
    this.reset()
  }

  reset(): void { this.primary.reset(); this.secondary.reset() }
  pause(): void { this.active().forEach((player) => player.pause()) }
  step(): void { this.active().forEach((player) => player.step()) }
  setSpeed(speed: number): void { this.primary.setSpeed(speed); this.secondary.setSpeed(speed) }
  advance(deltaMs: number): void { this.active().forEach((player) => player.advance(deltaMs)) }

  play(): void {
    if (this.getStatus() === 'complete') this.reset()
    // An already-finished side stays sorted when its partner resumes.
    for (const player of this.active()) if (player.getStatus() !== 'complete') player.play()
  }

  seek(position: number): void {
    if (!Number.isFinite(position)) throw new Error('Timeline position must be finite.')
    const target = Math.max(0, Math.min(Math.round(position), this.getTotal()))
    for (const player of this.active()) player.seek(Math.min(target, player.getTotal()))
  }

  back(): void { this.seek(Math.max(0, Math.ceil(this.getPosition()) - 1)) }

  getSnapshot(): SessionSnapshot {
    const primary = this.primary.getSnapshot()
    const secondary = this.secondary.getSnapshot()
    const status = this.getStatus()
    const total = this.getTotal()
    const position = this.getPosition()
    return {
      primary, secondary, comparing: this.comparing, status, position, total,
      progress: total ? position / total : status === 'complete' ? 1 : 0,
      elapsedMs: this.comparing ? Math.max(primary.elapsedMs, secondary.elapsedMs) : primary.elapsedMs,
    }
  }
}
