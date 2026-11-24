import { BarCanvas } from './BarCanvas.tsx'
import type { Snapshot, SortPlayer } from '../sorting/player.ts'

export function ArrayPlot({ player, snapshot, reducedMotion, reserveBuffer = false }: {
  player: SortPlayer; snapshot: Snapshot; reducedMotion: boolean; reserveBuffer?: boolean
}) {
  const buffer = reserveBuffer || snapshot.algorithm === 'merge'
  return <>
    <div className={`plot ${buffer ? 'merge-plot' : ''}`}>
      <div className="plot-scale" aria-hidden="true"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
      <BarCanvas player={player} snapshot={snapshot} reducedMotion={reducedMotion} reserveBuffer={reserveBuffer} />
    </div>
    <div className="plot-caption"><span>ARRAY POSITION</span><span>{snapshot.status === 'complete' ? 'ORDER FOUND' : 'EVERY MOVE TELLS A STORY'}</span></div>
    <div className="legend" aria-label="Bar colors"><span><i className="swatch unsorted" />Unsorted</span><span><i className="swatch comparing" />Comparing</span><span><i className="swatch moving" />{snapshot.algorithm === 'merge' ? 'Writing' : 'Moving'}</span>{(snapshot.algorithm === 'quick' || snapshot.algorithm === 'selection') && <span><i className="swatch reference" />{snapshot.algorithm === 'quick' ? 'Pivot' : 'Minimum'}</span>}<span><i className="swatch sorted" />Sorted</span></div>
  </>
}
