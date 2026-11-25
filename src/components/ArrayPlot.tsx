import { useI18n } from '../i18n/LanguageProvider.tsx'
import { BarCanvas } from './BarCanvas.tsx'
import { BucketPanel } from './BucketPanel.tsx'
import type { Snapshot, SortPlayer } from '../sorting/player.ts'

export function ArrayPlot({ player, snapshot, reducedMotion, reserveBuffer = false }: {
  player: SortPlayer; snapshot: Snapshot; reducedMotion: boolean; reserveBuffer?: boolean
}) {
  const { t, n } = useI18n()
  const distribution = snapshot.algorithm === 'counting' || snapshot.algorithm === 'radix'
  const searching = snapshot.target !== null
  const buffer = reserveBuffer || snapshot.algorithm === 'merge' || distribution
  return <>
    <div className={`plot ${buffer ? 'merge-plot' : ''}`} dir="ltr">
      <div className="plot-scale" aria-hidden="true"><span>{n(100)}</span><span>{n(75)}</span><span>{n(50)}</span><span>{n(25)}</span><span>{n(0)}</span></div>
      <BarCanvas player={player} snapshot={snapshot} reducedMotion={reducedMotion} reserveBuffer={reserveBuffer} />
    </div>
    <div className="plot-caption"><span>{t('position')}</span><span>{t(searching ? snapshot.status === 'complete' ? 'searchFinished' : 'searchMoves' : snapshot.status === 'complete' ? 'orderFound' : 'everyMove')}</span></div>
    {searching ? <div className="legend" aria-label={t('legend')}><span><i className="swatch unsorted" />{t('candidates')}</span><span><i className="swatch comparing" />{t('probing')}</span><span><i className="swatch sorted" />{t('match')}</span></div>
      : <div className="legend" aria-label={t('legend')}><span><i className="swatch unsorted" />{t('unsorted')}</span><span><i className="swatch comparing" />{t(distribution ? 'activeBucket' : 'comparing')}</span><span><i className="swatch moving" />{t(snapshot.algorithm === 'merge' || distribution ? 'writing' : 'moving')}</span>{(snapshot.algorithm === 'quick' || snapshot.algorithm === 'selection') && <span><i className="swatch reference" />{t(snapshot.algorithm === 'quick' ? 'pivot' : 'minimum')}</span>}<span><i className="swatch sorted" />{t('complete')}</span></div>}
    {distribution && <BucketPanel snapshot={snapshot} />}
  </>
}
