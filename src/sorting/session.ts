import { SortPlayer, type Snapshot, type Status } from './player.ts'
import { isSearchAlgorithm, type AlgorithmFamily, type AlgorithmId } from './types.ts'

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
  family: AlgorithmFamily
  sortedForSearch: boolean
  target: number
}

/** Shared playback for sorting and searching, preserving the source dataset. */
export class PlaybackSession {
  readonly primary: SortPlayer
  readonly secondary: SortPlayer
  private comparing = false
  private original: number[]
  private target = 50

  constructor(values: readonly number[], primary: AlgorithmId = 'insertion', secondary: AlgorithmId = 'merge') {
    this.original = [...values]
    this.primary = new SortPlayer(primary === 'binary' ? [...values].sort((a, b) => a - b) : values, primary)
    this.secondary = new SortPlayer(secondary === 'binary' ? [...values].sort((a, b) => a - b) : values, secondary)
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
  getOriginalValues(): number[] { return [...this.original] }

  private sortedForSearch(): boolean {
    return this.primary.getSnapshot().algorithm === 'binary' || (this.comparing && this.secondary.getSnapshot().algorithm === 'binary')
  }

  private loadPlayers(primary = this.primary.getSnapshot().algorithm, secondary = this.secondary.getSnapshot().algorithm): void {
    const sorted = [...this.original].sort((a, b) => a - b)
    const sharedSorted = this.comparing && (primary === 'binary' || secondary === 'binary')
    this.primary.load(primary === 'binary' || sharedSorted ? sorted : this.original, primary, this.target)
    this.secondary.load(secondary === 'binary' || sharedSorted ? sorted : this.original, secondary, this.target)
  }

  load(values: readonly number[]): void {
    if (values.some((value) => !Number.isFinite(value))) throw new Error('Every array value must be finite.')
    this.original = [...values]
    this.loadPlayers()
  }

  setComparing(comparing: boolean): void {
    if (this.comparing === comparing) return
    this.comparing = comparing
    this.loadPlayers()
  }

  setAlgorithm(side: Side, algorithm: AlgorithmId): void {
    this.loadPlayers(side === 'primary' ? algorithm : this.primary.getSnapshot().algorithm, side === 'secondary' ? algorithm : this.secondary.getSnapshot().algorithm)
  }

  setFamily(family: AlgorithmFamily): void {
    this.loadPlayers(family === 'searching' ? 'linear' : 'insertion', family === 'searching' ? 'binary' : 'merge')
  }

  setTarget(target: number): void {
    if (!Number.isFinite(target)) throw new Error('Search target must be finite.')
    if (target === this.target) return
    this.target = target
    this.loadPlayers()
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
      family: isSearchAlgorithm(primary.algorithm) ? 'searching' : 'sorting',
      sortedForSearch: this.sortedForSearch(), target: this.target,
      progress: total ? position / total : status === 'complete' ? 1 : 0,
      elapsedMs: this.comparing ? Math.max(primary.elapsedMs, secondary.elapsedMs) : primary.elapsedMs,
    }
  }
}
