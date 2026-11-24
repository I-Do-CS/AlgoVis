import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { BarCanvas } from './components/BarCanvas.tsx'
import { makeDataset } from './sorting/insertion.ts'
import { SortPlayer, type Snapshot } from './sorting/player.ts'
import './App.css'

type IconName = 'play' | 'pause' | 'step' | 'reset' | 'shuffle' | 'check'
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    play: <path d="m8 5 11 7-11 7Z" />,
    pause: <path d="M8 5v14M16 5v14" />,
    step: <path d="m5 5 10 7-10 7ZM19 5v14" />,
    reset: <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" />,
    shuffle: <path d="m17 3 4 4-4 4M3 17l5-5M3 7h3c5 0 7 10 12 10h3M12 9c2-2 3-2 6-2h3m-4 6 4 4-4 4" />,
    check: <path d="m5 12 4 4L19 6" />,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
const SPEEDS = [6, 12, 24, 48, 96, 192]
const CODE = ['for i = 1 … n − 1', '  j = i', '  while j > 0 and a[j−1] > a[j]', '    swap(a[j−1], a[j])', '    j = j − 1']
const STATUS_LABELS = { ready: 'Ready to sort', playing: 'Sorting', paused: 'Paused', complete: 'Sorted' }
function operationText(snapshot: Snapshot): string {
  if (snapshot.status === 'complete') return 'Every element is in its place. Nicely sorted.'
  if (snapshot.status === 'ready') return 'Press play and watch order emerge.'
  const op = snapshot.operation
  if (op?.type === 'select') return `Pick the next element at position ${op.index + 1}.`
  if (op?.type === 'compare') return `Compare neighbors at positions ${op.indices[0] + 1} and ${op.indices[1] + 1}.`
  if (op?.type === 'swap') return 'Move the smaller element one position to the left.'
  return 'Take it one step at a time.'
}

export default function App() {
  const [player] = useState(() => new SortPlayer(makeDataset(50, 2026)))
  const [snapshot, setSnapshot] = useState(() => player.getSnapshot())
  const [size, setSize] = useState(50)
  const [speedIndex, setSpeedIndex] = useState(2)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const refresh = useCallback(() => setSnapshot(player.getSnapshot()), [player])
  const togglePlay = useCallback(() => {
    if (player.getSnapshot().status === 'playing') player.pause()
    else player.play()
    refresh()
  }, [player, refresh])
  const reset = useCallback(() => { player.reset(); refresh() }, [player, refresh])
  const step = useCallback(() => { player.step(); refresh() }, [player, refresh])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
      if ((event.target as HTMLElement)?.closest('button, input, select, textarea, a, [contenteditable="true"]')) return
      if (event.code === 'Space') { event.preventDefault(); togglePlay() }
      if (event.code === 'ArrowRight') { event.preventDefault(); step() }
      if (event.code === 'KeyR') { event.preventDefault(); reset() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [togglePlay, reset, step])
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  const newDataset = (nextSize = size) => {
    player.load(makeDataset(nextSize, crypto.getRandomValues(new Uint32Array(1))[0]))
    refresh()
  }
  const playing = snapshot.status === 'playing'
  const complete = snapshot.status === 'complete'
  const activeLines = complete ? [] : snapshot.operation?.type === 'select' ? [0, 1]
    : snapshot.operation?.type === 'compare' ? [2] : snapshot.operation?.type === 'swap' ? [3, 4] : []

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main" aria-label="Sort Studio home">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 24V15M12 24V8M19 24V12M26 24V4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
          <span>sort<span className="brand-light">studio</span><span className="brand-period">.</span></span>
        </a>
        <nav aria-label="Main navigation"><a className="nav-active" href="#main">Visualizer</a><a href="#how-it-works">How it works</a></nav>
        <span className="topbar-note">A little order. A lot of possibility.</span>
      </header>
      <main id="main">
        <div className="page-heading">
          <div><div className="eyebrow"><span className="small-line" /> ALGORITHMS, IN MOTION</div><h1>Make sense of the sort<span>.</span></h1><p>Slow it down. Follow each move. See how an algorithm thinks.</p></div>
          <span className="milestone-badge">YOUR PACE. YOUR EXPERIMENT.</span>
        </div>
        <div className="workspace">
          <section className="visualizer" aria-labelledby="visualizer-title">
            <div className="visualizer-header">
              <div><span className="eyebrow muted">LIVE CANVAS</span><h2 id="visualizer-title">Insertion sort <span className="element-tag">{size} elements</span></h2></div>
              <span className={`status status-${snapshot.status}`} role="status" aria-live="polite"><span />{STATUS_LABELS[snapshot.status]}</span>
            </div>
            <div className="plot"><div className="plot-scale" aria-hidden="true"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><BarCanvas player={player} snapshot={snapshot} onUpdate={refresh} reducedMotion={reducedMotion} /></div>
            <div className="plot-caption"><span>ARRAY POSITION</span><span>{complete ? 'ORDER FOUND' : 'EVERY MOVE TELLS A STORY'}</span></div>
            <div className="legend" aria-label="Bar colors"><span><i className="swatch unsorted" />Unsorted</span><span><i className="swatch comparing" />Comparing</span><span><i className="swatch moving" />Moving</span><span><i className="swatch sorted" />Sorted</span></div>
            <div className="transport">
              <div className="transport-buttons">
                <button className="button primary" onClick={togglePlay} aria-keyshortcuts="Space"><Icon name={playing ? 'pause' : 'play'} />{playing ? 'Pause' : complete ? 'Replay' : snapshot.status === 'paused' ? 'Resume' : 'Start sorting'}</button>
                <button className="button secondary" onClick={step} disabled={playing || complete} title="One operation (Right arrow)" aria-keyshortcuts="ArrowRight"><Icon name="step" />Step</button>
                <button className="icon-button" onClick={reset} aria-label="Reset array" title="Reset (R)" aria-keyshortcuts="R"><Icon name="reset" /></button>
              </div>
              <div className="speed-control"><label htmlFor="speed">Speed <output htmlFor="speed">{SPEEDS[speedIndex] / 24}×</output></label><input id="speed" type="range" min="0" max="5" step="1" value={speedIndex} aria-valuetext={`${SPEEDS[speedIndex] / 24} times, ${SPEEDS[speedIndex]} operations per second`} onChange={(event) => { const index = Number(event.target.value); setSpeedIndex(index); player.setSpeed(SPEEDS[index]); refresh() }} /></div>
            </div>
            <div className="experiment-controls">
              <div className="size-control"><label htmlFor="array-size">Array size <output htmlFor="array-size">{size}</output></label><input id="array-size" type="range" min="8" max="96" step="1" value={size} onChange={(event) => { const value = Number(event.target.value); setSize(value); newDataset(value) }} /></div>
              <button className="button secondary shuffle" onClick={() => newDataset()}><Icon name="shuffle" />Shuffle array</button>
            </div>
            <div className="progress-track" role="progressbar" aria-label="Sorting progress" aria-valuenow={Math.round(snapshot.progress * 100)} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${snapshot.progress * 100}%` }} /></div>
          </section>
          <aside className="explainer" id="how-it-works" aria-labelledby="algorithm-heading">
            <div className="eyebrow muted">UNDER THE HOOD</div>
            <div className="algorithm-title"><h2 id="algorithm-heading">Insertion sort</h2><span className="algorithm-icon" aria-hidden="true">↳</span></div>
            <p className="algorithm-description">Like sorting a hand of cards. Pick an element, move it left until it fits, and repeat.</p>
            <div className="algorithm-tags"><span>Comparison sort</span><span>Stable</span><span>In-place</span></div>
            <div className="code-heading"><span>THE RECIPE</span><span>PSEUDOCODE</span></div>
            <div className="code-block" aria-label="Insertion sort pseudocode">{CODE.map((line, index) => <div key={line} className={`code-line ${activeLines.includes(index) ? 'code-active' : ''}`}><span aria-hidden="true">{index + 1}</span><code>{line}</code></div>)}</div>
            <div className={`operation-note ${complete ? 'operation-complete' : ''}`}><span className="operation-symbol" aria-hidden="true">{complete ? <Icon name="check" /> : 'i'}</span><p data-testid="operation-description">{operationText(snapshot)}</p></div>
            <div className="complexity-grid"><div><span>Best case</span><strong>O(n)</strong></div><div><span>Average case</span><strong>O(n²)</strong></div><div><span>Algorithm space</span><strong>O(1)</strong></div></div>
            <p className="implementation-note">This version uses adjacent swaps. Each swap counts as two array writes.</p>
          </aside>
        </div>
        <section className="metrics" aria-label="Live sorting statistics">
          <div className="metric"><span>COMPARISONS</span><strong data-testid="comparisons">{snapshot.comparisons.toLocaleString()}</strong><small>Pairs put to the test</small></div>
          <div className="metric"><span>ARRAY WRITES</span><strong data-testid="writes">{snapshot.writes.toLocaleString()}</strong><small>Values moved into position</small></div>
          <div className="metric"><span>OPERATIONS</span><strong data-testid="operations">{snapshot.completed.toLocaleString()}<em> / {snapshot.total.toLocaleString()}</em></strong><small>Select, compare, or swap</small></div>
          <div className="metric"><span>PLAYBACK TIME</span><strong>{(snapshot.elapsedMs / 1000).toFixed(1)}<em> s</em></strong><small>Animation time, not a benchmark</small></div>
        </section>
        <details className="array-details"><summary>Inspect array values <span>{size} numbers</span></summary><p data-testid="array-values">{snapshot.values.join(', ')}</p></details>
        <footer><span>Built for the curious.</span><div><span><kbd>Space</kbd> play / pause</span><span><kbd>→</kbd> step</span><span><kbd>R</kbd> reset</span></div></footer>
      </main>
    </div>
  )
}
