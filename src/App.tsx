import { useCallback, useEffect, useState } from 'react'
import { ArrayPlot } from './components/ArrayPlot.tsx'
import { ComparisonView } from './components/ComparisonView.tsx'
import { PlaybackControls, Icon, SPEEDS } from './components/PlaybackControls.tsx'
import { usePlaybackClock } from './hooks/usePlaybackClock.ts'
import { ALGORITHMS, ALGORITHM_IDS } from './sorting/algorithms.ts'
import { DATASETS, makeDataset, shuffleValues, type DatasetId } from './sorting/datasets.ts'
import type { AlgorithmId } from './sorting/types.ts'
import type { Snapshot } from './sorting/player.ts'
import { PlaybackSession, type Side } from './sorting/session.ts'
import './App.css'

const STATUS_LABELS = { ready: 'Ready to sort', playing: 'Sorting', paused: 'Paused', complete: 'Sorted' }
function operationText(snapshot: Snapshot): string {
  if (snapshot.status === 'complete') return 'Every element is in its place. Nicely sorted.'
  if (snapshot.status === 'ready') return 'Press play and watch order emerge.'
  return snapshot.operation?.message ?? 'Take it one step at a time.'
}

export default function App() {
  const [session] = useState(() => new PlaybackSession(makeDataset(50, 2026)))
  const [state, setState] = useState(() => session.getSnapshot())
  const player = session.primary
  const snapshot = state.primary
  const [size, setSize] = useState(50)
  const [pattern, setPattern] = useState<DatasetId>('random')
  const [speedIndex, setSpeedIndex] = useState(2)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const refresh = useCallback(() => setState(session.getSnapshot()), [session])
  usePlaybackClock(session, refresh)
  const togglePlay = useCallback(() => {
    if (session.getStatus() === 'playing') session.pause()
    else session.play()
    refresh()
  }, [session, refresh])
  const reset = useCallback(() => { session.reset(); refresh() }, [session, refresh])
  const step = useCallback(() => { session.step(); refresh() }, [session, refresh])
  const back = useCallback(() => { session.back(); refresh() }, [session, refresh])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
      if ((event.target as HTMLElement)?.closest('button, input, select, textarea, a, [contenteditable="true"]')) return
      if (event.code === 'Space') { event.preventDefault(); togglePlay() }
      if (event.code === 'ArrowRight') { event.preventDefault(); step() }
      if (event.code === 'ArrowLeft') { event.preventDefault(); back() }
      if (event.code === 'KeyR') { event.preventDefault(); reset() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [togglePlay, reset, step, back])
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  const newDataset = (nextSize: number, nextPattern: DatasetId) => {
    session.load(makeDataset(nextSize, crypto.getRandomValues(new Uint32Array(1))[0], nextPattern))
    refresh()
  }
  const shuffle = () => {
    session.load(shuffleValues(session.getOriginalValues(), crypto.getRandomValues(new Uint32Array(1))[0]))
    if (pattern !== 'duplicates') setPattern('random')
    refresh()
  }
  const algorithm = ALGORITHMS[snapshot.algorithm]
  const complete = snapshot.status === 'complete'
  const activeLines = complete ? [] : snapshot.operation?.lines ?? []
  const changePattern = (value: DatasetId) => { setPattern(value); newDataset(size, value) }
  const changeAlgorithm = (side: Side, id: AlgorithmId) => { session.setAlgorithm(side, id); refresh() }
  const controls = <PlaybackControls state={state} speedIndex={speedIndex} size={size}
    onToggle={togglePlay} onStep={step} onBack={back} onReset={reset}
    onSeek={(position) => { session.seek(position); refresh() }}
    onSpeed={(index) => { setSpeedIndex(index); session.setSpeed(SPEEDS[index]); refresh() }}
    onSize={(value) => { setSize(value); newDataset(value, pattern) }} onShuffle={shuffle} />

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main" aria-label="AlgoVis home">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 24V15M12 24V8M19 24V12M26 24V4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
          <span>Algo<span className="brand-light">Vis</span><span className="brand-period">.</span></span>
        </a>
        <nav aria-label="Main navigation"><a className="nav-active" href="#main">Visualizer</a><a href="#how-it-works">How it works</a></nav>
        <span className="topbar-note">Algorithm Visualizer</span>
      </header>
      <main id="main">
        <div className="page-heading">
          <div><div className="eyebrow"><span className="small-line" /> ALGORITHMS, IN MOTION</div><h1>Make sense of the sort<span>.</span></h1><p>Slow it down. Follow each move. See how an algorithm thinks.</p></div>
          <div className="mode-switch" role="group" aria-label="View mode"><button aria-pressed={!state.comparing} onClick={() => { session.setComparing(false); refresh() }}>Explore</button><button aria-pressed={state.comparing} onClick={() => { session.setComparing(true); refresh() }}>Compare</button></div>
        </div>
        {state.comparing ? <ComparisonView session={session} state={state} pattern={pattern} reducedMotion={reducedMotion} controls={controls} onPattern={changePattern} onAlgorithm={changeAlgorithm} /> : <>
        <div className="workspace">
          <section className="visualizer" aria-labelledby="visualizer-title">
            <div className="visualizer-header">
              <div><span className="eyebrow muted">LIVE CANVAS</span><h2 id="visualizer-title">{algorithm.name} <span className="element-tag">{size} elements</span></h2></div>
              <span className={`status status-${snapshot.status}`} role="status" aria-live="polite"><span />{STATUS_LABELS[snapshot.status]}</span>
            </div>
            <div className="setup-controls">
              <div className="select-field"><label htmlFor="algorithm">Algorithm</label><select id="algorithm" value={snapshot.algorithm} onChange={(event) => changeAlgorithm('primary', event.target.value as AlgorithmId)}>{ALGORITHM_IDS.map((id) => <option key={id} value={id}>{ALGORITHMS[id].name}</option>)}</select></div>
              <div className="select-field"><label htmlFor="dataset">Dataset</label><select id="dataset" value={pattern} onChange={(event) => changePattern(event.target.value as DatasetId)}>{DATASETS.map((dataset) => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}</select></div>
            </div>
            <p className="setup-hint">Switch algorithms to explore the same starting array.</p>
            <ArrayPlot player={player} snapshot={snapshot} reducedMotion={reducedMotion} />
            {controls}
          </section>
          <aside className="explainer" id="how-it-works" aria-labelledby="algorithm-heading">
            <div className="eyebrow muted">UNDER THE HOOD</div>
            <div className="algorithm-title"><h2 id="algorithm-heading">{algorithm.name}</h2><span className="algorithm-icon" aria-hidden="true">↳</span></div>
            <p className="algorithm-description">{algorithm.description}</p>
            <div className="algorithm-tags">{algorithm.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="code-heading"><span>THE RECIPE</span><span>PSEUDOCODE</span></div>
            <div className="code-block" aria-label={`${algorithm.name} pseudocode`}>{algorithm.code.map((line, index) => <div key={line} className={`code-line ${activeLines.includes(index) ? 'code-active' : ''}`}><span aria-hidden="true">{index + 1}</span><code>{line}</code></div>)}</div>
            <div className={`operation-note ${complete ? 'operation-complete' : ''}`}><span className="operation-symbol" aria-hidden="true">{complete ? <Icon name="check" /> : 'i'}</span><p data-testid="operation-description">{operationText(snapshot)}</p></div>
            <div className="complexity-grid"><div><span>Best case</span><strong>{algorithm.best}</strong></div><div><span>Average case</span><strong>{algorithm.average}</strong></div><div><span>Worst case</span><strong>{algorithm.worst}</strong></div><div><span>Algorithm space</span><strong>{algorithm.space}</strong></div></div>
            <p className="implementation-note">{algorithm.note}</p>
          </aside>
        </div>
        <section className="metrics" aria-label="Live sorting statistics">
          <div className="metric"><span>COMPARISONS</span><strong data-testid="comparisons">{snapshot.comparisons.toLocaleString()}</strong><small>Pairs put to the test</small></div>
          <div className="metric"><span>ARRAY WRITES</span><strong data-testid="writes">{snapshot.writes.toLocaleString()}</strong><small>Values moved into position</small></div>
          <div className="metric"><span>OPERATIONS</span><strong data-testid="operations">{snapshot.completed.toLocaleString()}<em> / {snapshot.total.toLocaleString()}</em></strong><small>Every visualized algorithm step</small></div>
          <div className="metric"><span>PLAYBACK TIME</span><strong>{(snapshot.elapsedMs / 1000).toFixed(1)}<em> s</em></strong><small>Animation time since last seek</small></div>
        </section>
        <details className="array-details"><summary>Inspect array values <span>{size} numbers</span></summary><p data-testid="array-values">{snapshot.values.join(', ')}</p></details>
        </>}
        <footer><span className="creator">Created by <strong>Ali Ghelichkhani</strong></span><div><span><kbd>Space</kbd> play / pause</span><span><kbd>←</kbd> back</span><span><kbd>→</kbd> step</span><span><kbd>R</kbd> reset</span></div></footer>
      </main>
    </div>
  )
}
