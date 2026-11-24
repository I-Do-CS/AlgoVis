import type { ReactNode } from 'react'
import { ALGORITHMS, ALGORITHM_IDS } from '../sorting/algorithms.ts'
import { DATASETS, type DatasetId } from '../sorting/datasets.ts'
import type { Snapshot, SortPlayer } from '../sorting/player.ts'
import type { PlaybackSession, SessionSnapshot, Side } from '../sorting/session.ts'
import type { AlgorithmId } from '../sorting/types.ts'
import { ArrayPlot } from './ArrayPlot.tsx'

const STATUS = { ready: 'Ready to sort', playing: 'Sorting', paused: 'Paused', complete: 'Sorted' }

function ComparisonPanel({ side, player, snapshot, reducedMotion, onAlgorithm }: {
  side: Side; player: SortPlayer; snapshot: Snapshot; reducedMotion: boolean; onAlgorithm: (side: Side, id: AlgorithmId) => void
}) {
  const name = side === 'primary' ? 'Left' : 'Right'
  const algorithm = ALGORITHMS[snapshot.algorithm]
  return <section className="visualizer comparison-panel" data-testid={`comparison-${side}`} aria-labelledby={`${side}-title`}>
    <div className="visualizer-header"><div><span className="eyebrow muted">{name.toUpperCase()} ALGORITHM</span><h2 id={`${side}-title`}>{algorithm.name}<span className="element-tag">{snapshot.values.length} elements</span></h2></div><span className={`status status-${snapshot.status}`} role="status"><span />{STATUS[snapshot.status]}</span></div>
    <div className="setup-controls comparison-algorithm"><div className="select-field"><label htmlFor={`${side}-algorithm`}>{name} algorithm</label><select id={`${side}-algorithm`} value={snapshot.algorithm} onChange={(event) => onAlgorithm(side, event.target.value as AlgorithmId)}>{ALGORITHM_IDS.map((id) => <option key={id} value={id}>{ALGORITHMS[id].name}</option>)}</select></div></div>
    <ArrayPlot player={player} snapshot={snapshot} reducedMotion={reducedMotion} reserveBuffer />
    <div className="comparison-stats">
      <div><span>Comparisons</span><strong data-testid="comparisons">{snapshot.comparisons.toLocaleString()}</strong></div>
      <div><span>Array writes</span><strong data-testid="writes">{snapshot.writes.toLocaleString()}</strong></div>
      <div><span>Visual steps</span><strong data-testid="operations">{snapshot.completed.toLocaleString()}<small> / {snapshot.total.toLocaleString()}</small></strong></div>
    </div>
    <p className="comparison-operation" data-testid="operation-description">{snapshot.status === 'complete' ? 'Sorted. The final array stays in view.' : snapshot.status === 'ready' ? algorithm.description : snapshot.operation?.message}</p>
    <details className="array-details"><summary>Inspect {name.toLowerCase()} array values</summary><p data-testid="array-values">{snapshot.values.join(', ')}</p></details>
  </section>
}

function outcome(state: SessionSnapshot, metric: 'comparisons' | 'writes' | 'total') {
  if (state.status !== 'complete') return { name: '—', detail: 'Finish both sorts to compare totals.' }
  const left = state.primary[metric]
  const right = state.secondary[metric]
  if (left === right) return { name: 'Tie', detail: `${left.toLocaleString()} each` }
  const winner = left < right ? state.primary : state.secondary
  return { name: ALGORITHMS[winner.algorithm].name, detail: `${left.toLocaleString()} vs ${right.toLocaleString()} · ${Math.abs(left - right).toLocaleString()} fewer` }
}

export function ComparisonView({ session, state, pattern, reducedMotion, controls, onPattern, onAlgorithm }: {
  session: PlaybackSession; state: SessionSnapshot; pattern: DatasetId; reducedMotion: boolean; controls: ReactNode
  onPattern: (pattern: DatasetId) => void; onAlgorithm: (side: Side, id: AlgorithmId) => void
}) {
  return <section className="comparison-workspace" aria-label="Algorithm comparison">
    <div className="comparison-setup"><div><div className="eyebrow">ONE INPUT, TWO APPROACHES</div><h2>Watch the difference unfold.</h2><p>Both start with the same array and advance at the same step rate.</p></div><div className="select-field"><label htmlFor="dataset">Dataset</label><select id="dataset" value={pattern} onChange={(event) => onPattern(event.target.value as DatasetId)}>{DATASETS.map((dataset) => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}</select></div></div>
    <div className="comparison-grid"><ComparisonPanel side="primary" player={session.primary} snapshot={state.primary} reducedMotion={reducedMotion} onAlgorithm={onAlgorithm} /><ComparisonPanel side="secondary" player={session.secondary} snapshot={state.secondary} reducedMotion={reducedMotion} onAlgorithm={onAlgorithm} /></div>
    <section className="shared-controls" aria-label="Shared playback controls"><div className="shared-control-heading"><span className="eyebrow muted">SHARED PLAYBACK</span><span>{(state.elapsedMs / 1000).toFixed(1)} s animation time</span></div>{controls}</section>
    <section id="how-it-works" className="comparison-results" aria-labelledby="comparison-results-title"><div className="eyebrow muted">READ THE RESULTS</div><h2 id="comparison-results-title">Different paths to the same order.</h2><p>{state.status === 'complete' ? 'Both sorts have finished. Here is how their work compares on this input.' : 'A finished side stays sorted while its partner continues. Scrub backward to inspect how each algorithm got there.'}</p><div className="outcome-grid">{([['comparisons', 'Fewer comparisons'], ['writes', 'Fewer array writes'], ['total', 'Fewer visual steps']] as const).map(([metric, title]) => { const result = outcome(state, metric); return <div key={metric}><span>{title}</span><strong>{result.name}</strong><small>{result.detail}</small></div> })}</div><p className="comparison-method">Compare counts to understand the work. Visual steps also include selections and setup; animation time depends on playback speed and is not a CPU benchmark.</p></section>
  </section>
}
