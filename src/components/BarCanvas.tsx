import { useEffect, useRef } from 'react'
import type { Frame, Snapshot, SortPlayer } from '../sorting/player.ts'
import { useI18n } from '../i18n/LanguageProvider.tsx'
import type { I18n } from '../i18n/catalog.ts'

function draw(canvas: HTMLCanvasElement, frame: Frame, reducedMotion: boolean, reserveBuffer: boolean, i18n: I18n) {
  const { t, n, rtl } = i18n
  const font = (size: number) => `${size}px ${rtl ? 'Vazirmatn, sans-serif' : 'ui-monospace, monospace'}`
  const context = canvas.getContext('2d')
  if (!context) return
  const { width, height } = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  const pixelWidth = Math.round(width * ratio)
  const pixelHeight = Math.round(height * ratio)
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight }
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, width, height)
  context.direction = 'ltr'
  const caption = (text: string) => {
    context.direction = rtl ? 'rtl' : 'ltr'
    context.textAlign = rtl ? 'right' : 'left'
    context.fillText(text, rtl ? width - 1 : 1, 12)
    context.direction = 'ltr'
  }
  const merging = frame.algorithm === 'merge'
  const top = merging || reserveBuffer ? 78 : 32
  const bottom = 26
  const plotHeight = height - top - bottom
  const slotWidth = width / Math.max(frame.items.length, 1)
  const gap = Math.max(2, Math.min(5, slotWidth * 0.23))
  const barWidth = Math.max(1, slotWidth - gap)
  const operation = frame.operation
  const complete = frame.status === 'complete'
  const range = complete ? undefined : operation?.range
  const active = operation?.type === 'select' || operation?.type === 'write' ? [operation.index]
    : operation?.type === 'swap' || (operation?.type === 'compare' && operation.source !== 'buffer') ? operation.indices : []

  if (reserveBuffer && !merging) {
    context.font = font(rtl ? 12 : 10)
    context.textAlign = 'left'
    context.fillStyle = '#95a9b5'
    caption(t('noBuffer'))
    context.strokeStyle = '#2b3c47'
    context.beginPath(); context.moveTo(0, 61); context.lineTo(width, 61); context.stroke()
  }

  if (merging) {
    context.font = font(rtl ? 12 : 10)
    context.textAlign = 'left'
    context.fillStyle = '#95a9b5'
    const buffer = complete ? undefined : operation?.buffer
    caption(t(buffer ? 'buffer' : complete ? 'mergeComplete' : 'bufferWaiting'))
    if (buffer) {
      const reading = operation?.type === 'compare' && operation.source === 'buffer' ? operation.indices
        : operation?.type === 'write' ? [operation.sourceIndex] : []
      for (let i = 0; i < buffer.items.length; i++) {
        const index = buffer.start + i
        const item = buffer.items[i]
        const selected = reading.includes(index)
        const bufferHeight = Math.max(3, (item.value / 100) * 23)
        const x = index * slotWidth + gap / 2
        context.fillStyle = selected ? operation?.type === 'write' ? '#ed9abd' : '#edc07a' : '#5b8796'
        context.fillRect(x, 53 - bufferHeight, barWidth, bufferHeight)
        if (slotWidth >= 24) {
          context.font = font(11)
          context.textAlign = 'center'
          context.fillText(n(item.value), x + barWidth / 2, 49 - bufferHeight)
        }
      }
    }
    context.strokeStyle = '#2b3c47'
    context.beginPath(); context.moveTo(0, 61); context.lineTo(width, 61); context.stroke()
  }

  if (range) {
    context.fillStyle = '#1b2a32'
    context.fillRect(range[0] * slotWidth, top, (range[1] - range[0] + 1) * slotWidth, plotHeight)
  }
  context.strokeStyle = '#263640'
  context.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = top + (plotHeight * i) / 4 + 0.5
    context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke()
  }
  const transition = reducedMotion ? null : frame.transition
  const write = reducedMotion ? null : frame.writeTransition
  const ease = (progress: number) => (1 - Math.cos(progress * Math.PI)) / 2
  const easing = transition ? ease(transition.progress) : 0
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
    const value = write?.index === index ? write.from.value + (write.to.value - write.from.value) * ease(write.progress) : item.value
    const barHeight = (value / 100) * plotHeight
    const highlighted = active.includes(index) && !complete
    const reference = operation?.pivotId === item.id || operation?.minimumId === item.id
    const moving = operation?.type === 'swap' || operation?.type === 'write'
    const color = complete ? '#63d9b1' : reference ? '#b7a1ed' : highlighted ? moving ? '#ed9abd' : '#edc07a' : '#69cbd4'
    context.globalAlpha = range && (index < range[0] || index > range[1]) ? 0.38 : 1
    const gradient = context.createLinearGradient(0, height - bottom - barHeight, 0, height - bottom)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, complete ? '#307c6b' : reference ? '#63517e' : highlighted ? '#655b57' : '#2b6877')
    context.fillStyle = gradient
    context.beginPath()
    context.roundRect(x, height - bottom - barHeight + lift, barWidth, barHeight, [3, 3, 0, 0])
    context.fill()
    context.fillStyle = color
    context.fillRect(x + 1, height - bottom - barHeight + lift, Math.max(0, barWidth - 2), 2)
    if (slotWidth >= 24) {
      context.font = font(12); context.textAlign = 'center'
      context.fillStyle = highlighted || reference ? color : '#91a5b0'
      context.fillText(n(item.value), x + barWidth / 2, height - bottom - barHeight - 9 + lift)
    }
    context.globalAlpha = 1
  }
  context.font = font(11); context.fillStyle = '#6f8491'; context.textAlign = 'left'
  context.fillText(n(1), 1, height - 7)
  context.textAlign = 'right'; context.fillText(n(frame.items.length), width - 1, height - 7)
}

export function BarCanvas({ player, snapshot, reducedMotion, reserveBuffer }: {
  player: SortPlayer; snapshot: Snapshot; reducedMotion: boolean; reserveBuffer: boolean
}) {
  const i18n = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const needsDraw = useRef(true)
  useEffect(() => { needsDraw.current = true }, [snapshot])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let frameId: number
    needsDraw.current = true
    draw(canvas, player.getFrame(), reducedMotion, reserveBuffer, i18n)
    void document.fonts.ready.then(() => { needsDraw.current = true })
    const resize = new ResizeObserver(() => { needsDraw.current = true })
    resize.observe(canvas)
    const loop = () => {
      const playing = player.getFrame().status === 'playing'
      if (playing || needsDraw.current) { draw(canvas, player.getFrame(), reducedMotion, reserveBuffer, i18n); needsDraw.current = false }
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(frameId); resize.disconnect() }
  }, [player, reducedMotion, reserveBuffer, i18n])
  return <canvas ref={canvasRef} className="bar-canvas" role="img" dir="ltr" aria-label={i18n.t('canvasLabel', { name: i18n.algorithm(snapshot.algorithm).name, count: snapshot.values.length, percent: Math.round(snapshot.progress * 100) })} />
}
