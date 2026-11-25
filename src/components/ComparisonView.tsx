import type { ReactNode } from 'react'
import { ALGORITHM_IDS, SEARCH_ALGORITHM_IDS } from '../sorting/algorithms.ts'
import { DATASETS, type DatasetId } from '../sorting/datasets.ts'
import type { Snapshot, SortPlayer } from '../sorting/player.ts'
import type { PlaybackSession, SessionSnapshot, Side } from '../sorting/session.ts'
import type { AlgorithmId } from '../sorting/types.ts'
import { useI18n } from '../i18n/LanguageProvider.tsx'
import type { I18n } from '../i18n/catalog.ts'
import { ArrayPlot } from './ArrayPlot.tsx'

function ComparisonPanel({ side, player, snapshot, reducedMotion, onAlgorithm }: {
  side: Side; player: SortPlayer; snapshot: Snapshot; reducedMotion: boolean; onAlgorithm: (side: Side, id: AlgorithmId) => void
}) {
  const { t, n, algorithm: translatedAlgorithm, operation, values, status: statusText, searchResult } = useI18n()
  const label = t(side === 'primary' ? 'leftAlgorithm' : 'rightAlgorithm')
  const algorithm = translatedAlgorithm(snapshot.algorithm)
  const searching = snapshot.target !== null
  const algorithmIds = searching ? SEARCH_ALGORITHM_IDS : ALGORITHM_IDS
  return <section className="visualizer comparison-panel" data-testid={`comparison-${side}`} aria-labelledby={`${side}-title`}>
    <div className="visualizer-header"><div><span className="eyebrow muted">{label.toUpperCase()}</span><h2 id={`${side}-title`}>{algorithm.name}<span className="element-tag">{t('elements', { count: snapshot.values.length })}</span></h2></div><span className={`status status-${snapshot.status}`} role="status"><span />{statusText(snapshot.status, snapshot.algorithm)}</span></div>
    <div className="setup-controls comparison-algorithm"><div className="select-field"><label htmlFor={`${side}-algorithm`}>{label}</label><select id={`${side}-algorithm`} value={snapshot.algorithm} onChange={(event) => onAlgorithm(side, event.target.value as AlgorithmId)}>{algorithmIds.map((id) => <option key={id} value={id}>{translatedAlgorithm(id).name}</option>)}</select></div></div>
    <ArrayPlot player={player} snapshot={snapshot} reducedMotion={reducedMotion} reserveBuffer />
    <div className="comparison-stats">
      <div><span>{t('comparisons')}</span><strong data-testid="comparisons">{n(snapshot.comparisons)}</strong></div>
      <div><span>{t('writes')}</span><strong data-testid="writes">{n(snapshot.writes)}</strong></div>
      <div><span>{t('visualSteps')}</span><strong data-testid="operations" dir="ltr">{n(snapshot.completed)}<small> / {n(snapshot.total)}</small></strong></div>
    </div>
    <p className="comparison-operation" data-testid="operation-description">{snapshot.searchResult ? searchResult(snapshot.searchResult) : snapshot.status === 'complete' ? t('held') : snapshot.status === 'ready' ? searching ? t('activeTarget', { target: snapshot.target! }) : algorithm.description : operation(snapshot.operation)}</p>
    <details className="array-details"><summary>{t(side === 'primary' ? 'inspectLeft' : 'inspectRight')}</summary><p data-testid="array-values" dir="ltr">{values(snapshot.values)}</p></details>
  </section>
}

function outcome(state: SessionSnapshot, metric: 'comparisons' | 'writes' | 'total', i18n: I18n) {
  const { t, algorithm } = i18n
  if (state.status !== 'complete') return { name: '—', detail: t(state.family === 'searching' ? 'finishBothSearch' : 'finishBoth') }
  const left = state.primary[metric]
  const right = state.secondary[metric]
  if (left === right) return { name: t('tie'), detail: t('each', { count: left }) }
  const winner = left < right ? state.primary : state.secondary
  return { name: algorithm(winner.algorithm).name, detail: t('resultCounts', { a: left, b: right, difference: Math.abs(left - right) }) }
}

export function ComparisonView({ session, state, pattern, reducedMotion, controls, onPattern, onAlgorithm }: {
  session: PlaybackSession; state: SessionSnapshot; pattern: DatasetId; reducedMotion: boolean; controls: ReactNode
  onPattern: (pattern: DatasetId) => void; onAlgorithm: (side: Side, id: AlgorithmId) => void
}) {
  const i18n = useI18n()
  const { t, n, dataset } = i18n
  const searching = state.family === 'searching'
  const outcomes = searching ? ([['comparisons', 'fewerComparisons'], ['total', 'fewerSteps']] as const) : ([['comparisons', 'fewerComparisons'], ['writes', 'fewerWrites'], ['total', 'fewerSteps']] as const)
  return <section className="comparison-workspace" aria-label={t('comparisonRegion')}>
    <div className="comparison-setup"><div><div className="eyebrow">{t('oneInput')}</div><h2>{t('unfold')}</h2><p>{t('sameInput')}</p></div><div className="select-field"><label htmlFor="dataset">{t('dataset')}</label><select id="dataset" value={pattern} onChange={(event) => onPattern(event.target.value as DatasetId)}>{DATASETS.map((entry) => <option key={entry.id} value={entry.id}>{dataset(entry.id)}</option>)}</select></div></div>
    <div className="comparison-grid"><ComparisonPanel side="primary" player={session.primary} snapshot={state.primary} reducedMotion={reducedMotion} onAlgorithm={onAlgorithm} /><ComparisonPanel side="secondary" player={session.secondary} snapshot={state.secondary} reducedMotion={reducedMotion} onAlgorithm={onAlgorithm} /></div>
    <section className="shared-controls" aria-label={t('sharedControls')}><div className="shared-control-heading"><span className="eyebrow muted">{t('sharedPlayback')}</span><span>{t('animationTime', { seconds: n(state.elapsedMs / 1000, 1) })}</span></div>{controls}</section>
    <section id="how-it-works" className="comparison-results" aria-labelledby="comparison-results-title"><div className="eyebrow muted">{t('readResults')}</div><h2 id="comparison-results-title">{t(searching ? 'searchDifferentPaths' : 'differentPaths')}</h2><p>{t(searching ? state.status === 'complete' ? 'searchFinishedBoth' : 'searchCompareHint' : state.status === 'complete' ? 'finishedBoth' : 'compareHint')}</p><div className={`outcome-grid ${searching ? 'search-outcomes' : ''}`}>{outcomes.map(([metric, title]) => { const result = outcome(state, metric, i18n); return <div key={metric}><span>{t(title)}</span><strong>{result.name}</strong><small>{result.detail}</small></div> })}</div><p className="comparison-method">{t('method')}</p></section>
  </section>
}
