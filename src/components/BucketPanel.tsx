import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n/LanguageProvider.tsx'
import type { Snapshot } from '../sorting/player.ts'

export function BucketPanel({ snapshot }: { snapshot: Snapshot }) {
  const { t, n } = useI18n()
  const strip = useRef<HTMLDivElement>(null)
  const buckets = snapshot.operation?.buckets
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
  const title = buckets?.phase === 'prefix' ? 'bucketPrefix' : buckets?.phase === 'place' ? 'bucketPlace' : buckets?.phase === 'write' ? 'bucketWrite' : 'bucketCount'
  return <section className="bucket-panel" aria-label={t('buckets')}>
    <div className="bucket-heading"><span>{t(title)}</span>{buckets?.digit !== undefined && <strong>{t('digitPlace', { digit: buckets.digit })}</strong>}</div>
    {buckets ? <div ref={strip} className="bucket-strip" dir="ltr" tabIndex={0} role="region" aria-label={t('buckets')}>
      {buckets.labels.map((label, index) => <div className="bucket-cell" key={label} data-active={index === buckets.active}>
        <span>{n(label)}</span><strong>{n(buckets.counts[index])}</strong>
      </div>)}
    </div> : <p>{t('bucketWaiting')}</p>}
  </section>
}
