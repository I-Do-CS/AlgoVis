import { useEffect } from 'react'
import type { PlaybackSession } from '../sorting/session.ts'

/** Advance every active canvas from one browser clock, publishing counters separately. */
export function usePlaybackClock(session: PlaybackSession, onUpdate: () => void): void {
  useEffect(() => {
    let frameId: number
    let previousTime: number | null = null
    let lastUpdate = 0
    const resetClock = () => { previousTime = null }
    document.addEventListener('visibilitychange', resetClock)
    const loop = (time: number) => {
      if (session.getStatus() === 'playing') {
        session.advance(previousTime === null ? 0 : Math.min(time - previousTime, 100))
        if (time - lastUpdate >= 80 || session.getStatus() === 'complete') {
          lastUpdate = time
          onUpdate()
        }
      }
      previousTime = time
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(frameId); document.removeEventListener('visibilitychange', resetClock) }
  }, [session, onUpdate])
}
