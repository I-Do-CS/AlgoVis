import { useEffect, useRef } from 'react'
import type { Frame, Snapshot, SortPlayer } from '../sorting/player.ts'

function draw(canvas: HTMLCanvasElement, frame: Frame, reducedMotion: boolean) {
  const context = canvas.getContext('2d')
  if (!context) return
  const { width, height } = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  const pixelWidth = Math.round(width * ratio)
  const pixelHeight = Math.round(height * ratio)
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight }
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, width, height)
  const top = 32
  const bottom = 26
  const plotHeight = height - top - bottom
  const slotWidth = width / Math.max(frame.items.length, 1)
  const gap = Math.max(2, Math.min(5, slotWidth * 0.23))
  const barWidth = Math.max(1, slotWidth - gap)
  context.strokeStyle = '#223039'
  context.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = top + (plotHeight * i) / 4 + 0.5
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke()
  }
  const operation = frame.operation
  const active = operation?.type === 'select' ? [operation.index] : operation?.indices ?? []
  const transition = reducedMotion ? null : frame.transition
  const easing = transition ? (1 - Math.cos(transition.progress * Math.PI)) / 2 : 0
  // Values and their stable identities travel together, including equal values.
  for (let index = 0; index < frame.items.length; index++) {
    const item = frame.items[index]
    let x = index * slotWidth + gap / 2
    let lift = 0
    if (transition) {
      const [a, b] = transition.indices
      if (index === a || index === b) {
        x += ((index === a ? b : a) - index) * slotWidth * easing
        lift = Math.sin(transition.progress * Math.PI) * (index === a ? -9 : 9)
      }
    }
    const barHeight = (item.value / 100) * plotHeight
    const highlighted = active.includes(index) && frame.status !== 'complete'
    const color = frame.status === 'complete' ? '#63d9b1' : highlighted ? operation?.type === 'swap' ? '#ed9abd' : '#edc07a' : '#69cbd4'
    const gradient = context.createLinearGradient(0, height - bottom - barHeight, 0, height - bottom)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, frame.status === 'complete' ? '#307c6b' : highlighted ? '#655b57' : '#2b6877')
    context.fillStyle = gradient
    context.beginPath()
    context.roundRect(x, height - bottom - barHeight + lift, barWidth, barHeight, [3, 3, 0, 0])
    context.fill()
    context.fillStyle = color
    context.fillRect(x + 1, height - bottom - barHeight + lift, Math.max(0, barWidth - 2), 2)
    if (slotWidth >= 24) {
      context.font = '12px ui-monospace, monospace'; context.textAlign = 'center'
      context.fillStyle = highlighted ? '#f0d3a9' : '#91a5b0'
      context.fillText(String(item.value), x + barWidth / 2, height - bottom - barHeight - 9 + lift)
    }
  }
  context.font = '11px ui-monospace, monospace'; context.fillStyle = '#6f8491'; context.textAlign = 'left'
  context.fillText('1', 1, height - 7)
  context.textAlign = 'right'; context.fillText(String(frame.items.length), width - 1, height - 7)
}

export function BarCanvas({ player, snapshot, onUpdate, reducedMotion }: {
  player: SortPlayer; snapshot: Snapshot; onUpdate: () => void; reducedMotion: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const needsDraw = useRef(true)
  useEffect(() => { needsDraw.current = true }, [snapshot])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let frameId: number
    let previousTime: number | null = null
    let lastUpdate = 0
    needsDraw.current = true
    const resize = new ResizeObserver(() => { needsDraw.current = true })
    resize.observe(canvas)
    const resetClock = () => { previousTime = null; needsDraw.current = true }
    document.addEventListener('visibilitychange', resetClock)
    const loop = (time: number) => {
      const playing = player.getFrame().status === 'playing'
      if (playing) {
        // Returning to a hidden tab must not jump through the experiment.
        player.advance(previousTime === null ? 0 : Math.min(time - previousTime, 100))
        if (time - lastUpdate >= 80 || player.getFrame().status === 'complete') { lastUpdate = time; onUpdate() }
      }
      if (playing || needsDraw.current) { draw(canvas, player.getFrame(), reducedMotion); needsDraw.current = false }
      previousTime = time
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(frameId); resize.disconnect(); document.removeEventListener('visibilitychange', resetClock) }
  }, [player, onUpdate, reducedMotion])
  return <canvas ref={canvasRef} className="bar-canvas" role="img" aria-label={`Array of ${snapshot.values.length} bars. ${Math.round(snapshot.progress * 100)} percent complete. Expand Inspect array values below for the numbers.`} />
}
