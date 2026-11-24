import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createI18n, type I18n, type Language } from './catalog.ts'

const STORAGE_KEY = 'algovis-language'
const LanguageContext = createContext<(I18n & { changeLanguage: (language: Language) => void }) | null>(null)

function initialLanguage(): Language {
  try { return localStorage.getItem(STORAGE_KEY) === 'fa' ? 'fa' : 'en' } catch { return 'en' }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(initialLanguage)
  const requested = useRef(language)
  const generation = useRef(0)
  const transition = useRef<ViewTransition | null>(null)
  const fade = useRef<Animation | null>(null)
  const i18n = useMemo(() => createI18n(language), [language])

  useLayoutEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr'
    document.title = language === 'fa' ? 'AlgoVis — نمایشگر الگوریتم‌ها' : 'AlgoVis — Algorithm Visualizer'
    document.querySelector('meta[name="description"]')?.setAttribute('content', i18n.t('intro'))
    try { localStorage.setItem(STORAGE_KEY, language) } catch { /* The toggle also works without browser storage. */ }
  }, [language, i18n])

  const changeLanguage = useCallback((next: Language) => {
    if (next === requested.current) return
    requested.current = next
    const request = ++generation.current
    transition.current?.skipTransition()
    fade.current?.cancel()
    fade.current = null
    const apply = () => { if (request === generation.current) flushSync(() => setLanguage(next)) }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); return }
    if (typeof document.startViewTransition === 'function') {
      try {
        const active = document.startViewTransition(apply)
        transition.current = active
        void active.ready.catch(() => { /* A skipped transition still applies its DOM update. */ })
        void active.finished.then(() => { if (transition.current === active) transition.current = null }).catch(() => {})
        return
      } catch { /* Fall back to a short fade when view transitions are unavailable. */ }
    }
    apply()
    const animation = document.getElementById('root')?.animate?.([{ opacity: 0.55 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' })
    if (animation) {
      fade.current = animation
      void animation.finished.then(() => { if (fade.current === animation) fade.current = null }).catch(() => {})
    }
  }, [])

  const value = useMemo(() => ({ ...i18n, changeLanguage }), [i18n, changeLanguage])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useI18n() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useI18n must be used within LanguageProvider.')
  return context
}

export function LanguageToggle() {
  const { language, t, changeLanguage } = useI18n()
  return <div className="language-toggle" role="group" aria-label={t('language')}>
    <button type="button" lang="en" dir="ltr" aria-label="English" aria-pressed={language === 'en'} onClick={() => changeLanguage('en')}>EN</button>
    <button type="button" lang="fa" dir="rtl" aria-pressed={language === 'fa'} onClick={() => changeLanguage('fa')}>فارسی</button>
  </div>
}
