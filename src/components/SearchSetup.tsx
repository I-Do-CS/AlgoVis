import { useI18n } from '../i18n/LanguageProvider.tsx'

export function SearchSetup({ draft, valid, sorted, onTarget, onPick }: {
  draft: string; valid: boolean; sorted: boolean; onTarget: (value: string) => void; onPick: () => void
}) {
  const { t } = useI18n()
  return <section className="search-setup" aria-label={t('target')}>
    <div className="target-field"><label htmlFor="search-target">{t('target')}</label><input id="search-target" type="number" step="any" value={draft} onChange={(event) => onTarget(event.target.value)} aria-invalid={!valid} aria-describedby="target-hint" dir="ltr" /></div>
    <button className="button secondary" onClick={onPick}>{t('pickTarget')}</button>
    <p id="target-hint" className={valid ? '' : 'target-error'}>{t(valid ? 'targetHint' : 'invalidTarget')}</p>
    <p className="search-input-hint" data-testid="search-input-hint">{t(sorted ? 'binaryInputHint' : 'searchInputHint')}</p>
  </section>
}
