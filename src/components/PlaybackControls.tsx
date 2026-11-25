import type { ReactNode } from 'react'
import { useI18n } from '../i18n/LanguageProvider.tsx'
import type { SessionSnapshot } from '../sorting/session.ts'

type IconName = 'play' | 'pause' | 'step' | 'back' | 'reset' | 'shuffle' | 'check'
export function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    play: <path d="m8 5 11 7-11 7Z" />,
    pause: <path d="M8 5v14M16 5v14" />,
    step: <path d="m5 5 10 7-10 7ZM19 5v14" />,
    back: <path d="m19 5-10 7 10 7ZM5 5v14" />,
    reset: <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" />,
    shuffle: <path d="m17 3 4 4-4 4M3 17l5-5M3 7h3c5 0 7 10 12 10h3M12 9c2-2 3-2 6-2h3m-4 6 4 4-4 4" />,
    check: <path d="m5 12 4 4L19 6" />,
  }
  return <svg className={['play', 'step', 'back'].includes(name) ? 'directional-icon' : undefined} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export const SPEEDS = [6, 12, 24, 48, 96, 192]

export function PlaybackControls({ state, speedIndex, size, onToggle, onStep, onBack, onReset, onSeek, onSpeed, onSize, onShuffle, disabled = false }: {
  state: SessionSnapshot
  speedIndex: number
  size: number
  onToggle: () => void
  onStep: () => void
  onBack: () => void
  onReset: () => void
  onSeek: (position: number) => void
  onSpeed: (index: number) => void
  onSize: (size: number) => void
  onShuffle: () => void
  disabled?: boolean
}) {
  const { t, n, rtl } = useI18n()
  const playing = state.status === 'playing'
  const complete = state.status === 'complete'
  const current = Math.floor(state.position)
  return <>
    <div className="timeline-control">
      <label htmlFor="timeline">{t(state.comparing ? 'sharedTimeline' : 'timeline')}<output htmlFor="timeline" dir="ltr">{n(current)} / {n(state.total)}</output></label>
      <input id="timeline" type="range" min="0" max={state.total} step="1" value={current} disabled={disabled} aria-valuetext={t('timelineValue', { current, total: state.total })} onChange={(event) => onSeek(Number(event.target.value))} />
      <p>{t('timelineHint')}</p>
    </div>
    <div className="transport">
      <div className="transport-buttons">
        <button className="button primary" onClick={onToggle} disabled={disabled} aria-keyshortcuts="Space"><Icon name={playing ? 'pause' : 'play'} />{t(playing ? 'pause' : complete ? 'replay' : state.status === 'paused' ? 'resume' : state.comparing ? 'startBoth' : state.family === 'searching' ? 'startSearch' : 'start')}</button>
        <button className="icon-button back-button" onClick={onBack} disabled={disabled || playing || state.position === 0} aria-label={t('previous')} title={t('previousTitle', { key: t(rtl ? 'rightKey' : 'leftKey') })} aria-keyshortcuts={rtl ? 'ArrowRight' : 'ArrowLeft'}><Icon name="back" /></button>
        <button className="button secondary step-button" onClick={onStep} disabled={disabled || playing || complete} title={t('stepTitle', { key: t(rtl ? 'leftKey' : 'rightKey') })} aria-keyshortcuts={rtl ? 'ArrowLeft' : 'ArrowRight'}><Icon name="step" />{t('step')}</button>
        <button className="icon-button" onClick={onReset} aria-label={t('reset')} title={t('resetTitle')} aria-keyshortcuts="R"><Icon name="reset" /></button>
      </div>
      <div className="speed-control"><label htmlFor="speed">{t('speed')} <output htmlFor="speed" dir="ltr">{n(SPEEDS[speedIndex] / 24)}×</output></label><input id="speed" type="range" min="0" max="5" step="1" value={speedIndex} aria-valuetext={t('speedValue', { multiplier: SPEEDS[speedIndex] / 24, rate: SPEEDS[speedIndex] })} onChange={(event) => onSpeed(Number(event.target.value))} /></div>
    </div>
    <div className="experiment-controls">
      <div className="size-control"><label htmlFor="array-size">{t('arraySize')} <output htmlFor="array-size">{n(size)}</output></label><input id="array-size" type="range" min="8" max="96" step="1" value={size} aria-valuetext={n(size)} onChange={(event) => onSize(Number(event.target.value))} /></div>
      <button className="button secondary shuffle" onClick={onShuffle}><Icon name="shuffle" />{t('shuffle')}</button>
    </div>
    <div className="progress-track" role="progressbar" aria-label={t(state.family === 'searching' ? 'searchProgress' : 'progress')} aria-valuenow={Math.round(state.progress * 100)} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${state.progress * 100}%` }} /></div>
  </>
}
