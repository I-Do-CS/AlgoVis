import { useCallback, useEffect, useState } from 'react'
import { ArrayPlot } from './components/ArrayPlot.tsx'
import { ComparisonView } from './components/ComparisonView.tsx'
import { SearchSetup } from './components/SearchSetup.tsx'
import { PlaybackControls, Icon, SPEEDS } from './components/PlaybackControls.tsx'
import { usePlaybackClock } from './hooks/usePlaybackClock.ts'
import { ALGORITHM_IDS, SEARCH_ALGORITHM_IDS } from './sorting/algorithms.ts'
import { DATASETS, makeDataset, shuffleValues, type DatasetId } from './sorting/datasets.ts'
import type { AlgorithmId } from './sorting/types.ts'
import { LanguageToggle, useI18n } from './i18n/LanguageProvider.tsx'
import { PlaybackSession, type Side } from './sorting/session.ts'
import './App.css'

export default function App() {
  const { t, n, rtl, algorithm: translatedAlgorithm, dataset, operation, values, status: statusText, searchResult } = useI18n()
  const [session] = useState(() => new PlaybackSession(makeDataset(50, 2026)))
  const [state, setState] = useState(() => session.getSnapshot())
  const player = session.primary
  const snapshot = state.primary
  const searching = state.family === 'searching'
  const [targetDraft, setTargetDraft] = useState('50')
  const validTarget = !searching || (targetDraft.trim() !== '' && Number.isFinite(Number(targetDraft)))
  const [size, setSize] = useState(50)
  const [pattern, setPattern] = useState<DatasetId>('random')
  const [speedIndex, setSpeedIndex] = useState(2)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const refresh = useCallback(() => setState(session.getSnapshot()), [session])
  usePlaybackClock(session, refresh)
  const togglePlay = useCallback(() => {
    if (!validTarget) return
    if (session.getStatus() === 'playing') session.pause()
    else session.play()
    refresh()
  }, [session, refresh, validTarget])
  const reset = useCallback(() => { session.reset(); refresh() }, [session, refresh])
  const step = useCallback(() => { if (validTarget) { session.step(); refresh() } }, [session, refresh, validTarget])
  const back = useCallback(() => { if (validTarget) { session.back(); refresh() } }, [session, refresh, validTarget])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
      if ((event.target as HTMLElement)?.closest('button, input, select, textarea, a, [contenteditable="true"]')) return
      if (event.code === 'Space') { event.preventDefault(); togglePlay() }
      if (event.code === (rtl ? 'ArrowLeft' : 'ArrowRight')) { event.preventDefault(); step() }
      if (event.code === (rtl ? 'ArrowRight' : 'ArrowLeft')) { event.preventDefault(); back() }
      if (event.code === 'KeyR') { event.preventDefault(); reset() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [togglePlay, reset, step, back, rtl])
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
  const algorithm = translatedAlgorithm(snapshot.algorithm)
  const complete = snapshot.status === 'complete'
  const activeLines = complete ? [] : snapshot.operation?.lines ?? []
  const changePattern = (value: DatasetId) => { setPattern(value); newDataset(size, value) }
  const changeAlgorithm = (side: Side, id: AlgorithmId) => { session.setAlgorithm(side, id); refresh() }
  const changeTarget = (draft: string) => {
    setTargetDraft(draft)
    if (draft.trim() !== '' && Number.isFinite(Number(draft))) session.setTarget(Number(draft))
    else session.reset()
    refresh()
  }
  const pickTarget = () => {
    const input = session.getOriginalValues()
    const target = input[Math.floor(input.length / 2)]
    setTargetDraft(String(target)); session.setTarget(target); session.reset(); refresh()
  }
  const algorithmIds = searching ? SEARCH_ALGORITHM_IDS : ALGORITHM_IDS
  const controls = <PlaybackControls state={state} speedIndex={speedIndex} size={size} disabled={!validTarget}
    onToggle={togglePlay} onStep={step} onBack={back} onReset={reset}
    onSeek={(position) => { session.seek(position); refresh() }}
    onSpeed={(index) => { setSpeedIndex(index); session.setSpeed(SPEEDS[index]); refresh() }}
    onSize={(value) => { setSize(value); newDataset(value, pattern) }} onShuffle={shuffle} />

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main" aria-label={t('home')} dir="ltr">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 24V15M12 24V8M19 24V12M26 24V4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
          <span lang="en">Algo<span className="brand-light">Vis</span><span className="brand-period">.</span></span>
        </a>
        <nav aria-label={t('navigation')}><a className="nav-active" href="#main">{t('visualizer')}</a><a href="#how-it-works">{t('how')}</a></nav>
        <span className="topbar-note">{t('appDescription')}</span>
        <LanguageToggle />
      </header>
      <main id="main">
        <div className="page-heading">
          <div><div className="eyebrow"><span className="small-line" /> {t('eyebrow')}</div><h1>{t(searching ? 'searchHeading' : 'heading')}<span>.</span></h1><p>{t(searching ? 'searchIntro' : 'intro')}</p></div>
          <div className="mode-switch" role="group" aria-label={t('viewMode')}><button aria-pressed={!state.comparing} onClick={() => { session.setComparing(false); refresh() }}>{t('explore')}</button><button aria-pressed={state.comparing} onClick={() => { session.setComparing(true); refresh() }}>{t('compare')}</button></div>
        </div>
        <div className="family-switch mode-switch" role="group" aria-label={t('family')}><button aria-pressed={!searching} onClick={() => { session.setFamily('sorting'); refresh() }}>{t('sorting')}</button><button aria-pressed={searching} onClick={() => { session.setFamily('searching'); refresh() }}>{t('searching')}</button></div>
        {searching && <SearchSetup draft={targetDraft} valid={validTarget} sorted={state.sortedForSearch} onTarget={changeTarget} onPick={pickTarget} />}
        {state.comparing ? <ComparisonView session={session} state={state} pattern={pattern} reducedMotion={reducedMotion} controls={controls} onPattern={changePattern} onAlgorithm={changeAlgorithm} /> : <>
        <div className="workspace">
          <section className="visualizer" aria-labelledby="visualizer-title">
            <div className="visualizer-header">
              <div><span className="eyebrow muted">{t('live')}</span><h2 id="visualizer-title">{algorithm.name} <span className="element-tag">{t('elements', { count: size })}</span></h2></div>
              <span className={`status status-${snapshot.status}`} role="status" aria-live="polite"><span />{statusText(snapshot.status, snapshot.algorithm)}</span>
            </div>
            <div className="setup-controls">
              <div className="select-field"><label htmlFor="algorithm">{t('algorithm')}</label><select id="algorithm" value={snapshot.algorithm} onChange={(event) => changeAlgorithm('primary', event.target.value as AlgorithmId)}>{algorithmIds.map((id) => <option key={id} value={id}>{translatedAlgorithm(id).name}</option>)}</select></div>
              <div className="select-field"><label htmlFor="dataset">{t('dataset')}</label><select id="dataset" value={pattern} onChange={(event) => changePattern(event.target.value as DatasetId)}>{DATASETS.map((entry) => <option key={entry.id} value={entry.id}>{dataset(entry.id)}</option>)}</select></div>
            </div>
            {searching ? <p className={`search-result ${snapshot.searchResult ? 'search-result-complete' : ''}`} role="status" aria-label={t('searchResultLabel')} data-testid="search-result">{!validTarget ? t('invalidTarget') : snapshot.searchResult ? searchResult(snapshot.searchResult) : t('activeTarget', { target: state.target })}</p> : <p className="setup-hint">{t('inputHint')}</p>}
            <ArrayPlot player={player} snapshot={snapshot} reducedMotion={reducedMotion} />
            {controls}
          </section>
          <aside className="explainer" id="how-it-works" aria-labelledby="algorithm-heading">
            <div className="eyebrow muted">{t('underHood')}</div>
            <div className="algorithm-title"><h2 id="algorithm-heading">{algorithm.name}</h2><span className="algorithm-icon" aria-hidden="true">↳</span></div>
            <p className="algorithm-description">{algorithm.description}</p>
            <div className="algorithm-tags">{algorithm.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="code-heading"><span>{t('recipe')}</span><span>{t('pseudocode')}</span></div>
            <div className="code-block" aria-label={t('pseudocodeLabel', { name: algorithm.name })} dir="ltr">{algorithm.code.map((line, index) => <div key={line} className={`code-line ${activeLines.includes(index) ? 'code-active' : ''}`}><span aria-hidden="true">{n(index + 1)}</span><code lang="en">{line}</code></div>)}</div>
            <div className={`operation-note ${complete ? 'operation-complete' : ''}`}><span className="operation-symbol" aria-hidden="true">{complete ? <Icon name="check" /> : 'i'}</span><p data-testid="operation-description">{snapshot.searchResult ? searchResult(snapshot.searchResult) : complete ? t('completeNote') : snapshot.status === 'ready' ? t(searching ? 'searchReadyNote' : 'readyNote') : operation(snapshot.operation)}</p></div>
            <div className="complexity-grid"><div><span>{t('best')}</span><strong><bdi dir="ltr">{algorithm.best}</bdi></strong></div><div><span>{t('average')}</span><strong><bdi dir="ltr">{algorithm.average}</bdi></strong></div><div><span>{t('worst')}</span><strong><bdi dir="ltr">{algorithm.worst}</bdi></strong></div><div><span>{t('space')}</span><strong><bdi dir="ltr">{algorithm.space}</bdi></strong></div></div>
            <p className="implementation-note">{algorithm.note}</p>
          </aside>
        </div>
        <section className="metrics" aria-label={t(searching ? 'searchMetrics' : 'metrics')}>
          <div className="metric"><span>{t('comparisons')}</span><strong data-testid="comparisons">{n(snapshot.comparisons)}</strong><small>{t(searching ? 'probesHint' : 'pairsHint')}</small></div>
          <div className="metric"><span>{t('writes')}</span><strong data-testid="writes">{n(snapshot.writes)}</strong><small>{t(searching ? 'searchWritesHint' : 'writesHint')}</small></div>
          <div className="metric"><span>{t('operations')}</span><strong data-testid="operations" dir="ltr">{n(snapshot.completed)}<em> / {n(snapshot.total)}</em></strong><small>{t('stepsHint')}</small></div>
          <div className="metric"><span>{t('playbackTime')}</span><strong>{n(snapshot.elapsedMs / 1000, 1)}<em> {t('secondsShort')}</em></strong><small>{t('timeHint')}</small></div>
        </section>
        <details className="array-details"><summary>{t('inspect')} <span>{t('numbers', { count: size })}</span></summary><p data-testid="array-values" dir="ltr">{values(snapshot.values)}</p></details>
        </>}
        <footer><span className="creator">{t('creator')} <strong><bdi dir="ltr" lang="en">Ali Ghelichkhani</bdi></strong></span><a className="source-link" href="https://github.com/I-Do-CS/AlgoVis" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.08c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 1.73 2.64 1.23 3.28.94.1-.73.4-1.23.71-1.51-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.01-.12-.29-.5-1.43.11-2.97 0 0 .95-.31 3.08 1.15A10.7 10.7 0 0 1 12 6.16c.95 0 1.9.13 2.79.38 2.13-1.46 3.08-1.15 3.08-1.15.61 1.54.23 2.68.11 2.97.72.78 1.16 1.78 1.16 3.01 0 4.32-2.64 5.27-5.15 5.55.41.35.77 1.03.77 2.08v3.09c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z" /></svg>{t('sourceCode')}</a><div><span><kbd dir="ltr">Space</kbd> {t('keyboardPlay')}</span><span><kbd>{rtl ? '→' : '←'}</kbd> {t('keyboardBack')}</span><span><kbd>{rtl ? '←' : '→'}</kbd> {t('keyboardStep')}</span><span><kbd dir="ltr">R</kbd> {t('keyboardReset')}</span></div></footer>
      </main>
    </div>
  )
}
