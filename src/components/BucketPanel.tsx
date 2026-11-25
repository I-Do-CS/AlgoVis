import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n/LanguageProvider.tsx'
import type { Snapshot } from '../sorting/player.ts'

export function BucketPanel({ snapshot }: { snapshot: Snapshot }) {
  const { t, n } = useI18n()
  const strip = useRef<HTMLDivElement>(null)
  const buckets = snapshot.operation?.buckets
  const radix = buckets?.radix
  const place = radix ? radix.digit === 1 ? t('units') : radix.digit === 10 ? t('tens') : radix.digit === 100 ? t('hundreds') : t('digitPlace', { digit: radix.digit }) : ''
  useEffect(() => {
    const container = strip.current
    const active = container?.querySelector<HTMLElement>('[data-active="true"]')
    if (!container || !active) return
    const outer = container.getBoundingClientRect()
    const inner = active.getBoundingClientRect()
    if (inner.left < outer.left || inner.right > outer.right) {
      container.scrollLeft += inner.left - outer.left - (outer.width - inner.width) / 2
    }
  }, [buckets])
  const title = buckets?.phase === 'prefix' ? 'bucketPrefix' : buckets?.phase === 'place' ? 'bucketPlace' : buckets?.phase === 'write' ? 'bucketWrite' : buckets?.phase === 'pass-complete' ? 'radixPassComplete' : 'bucketCount'
  return <section className="bucket-panel" aria-label={t('buckets')}>
    <div className="bucket-heading"><span>{t(title)}</span>{radix && <strong data-testid="radix-pass">{t('radixPass', { pass: radix.index, total: radix.total, place })}</strong>}</div>
    {buckets?.phase === 'write' && snapshot.status !== 'complete' ? <p>{t('distributionCopyHint')}</p>
      : snapshot.algorithm === 'radix' && <p className="radix-hint">{t(snapshot.status === 'complete' ? 'radixFinished' : 'radixOrderHint')}</p>}
    {radix && radix.offset > 0 && <p>{t('radixOffset', { offset: radix.offset })}</p>}
    {radix && buckets.source && buckets.active >= 0 && <p data-testid="radix-digit">{t('radixDigit', { value: buckets.source.value, key: buckets.source.key, place, digit: buckets.labels[buckets.active] })}</p>}
    {buckets ? <div ref={strip} className="bucket-strip" dir="ltr" tabIndex={0} role="region" aria-label={t('buckets')}>
      {buckets.labels.map((label, index) => <div className="bucket-cell" key={label} data-active={index === buckets.active}>
        <span>{n(label)}</span><strong>{n(buckets.counts[index])}</strong>
      </div>)}
    </div> : <p>{t('bucketWaiting')}</p>}
    {buckets && <p data-testid="output-progress">{t('outputProgress', { placed: buckets.output.filter((item) => item !== null).length, count: buckets.output.length })}</p>}
  </section>
}
