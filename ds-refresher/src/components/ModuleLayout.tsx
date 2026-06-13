import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MODULES, type ModuleMeta } from '../lib/modules'
import { useProgress } from '../hooks/useProgress'

export interface SectionDef {
  id: string
  label: string
}

interface ModuleLayoutProps {
  module: ModuleMeta
  sections: SectionDef[]
  children: ReactNode
}

export function ModuleLayout({ module, sections, children }: ModuleLayoutProps) {
  const { markVisited } = useProgress()
  const navigate = useNavigate()
  const [active, setActive] = useState<string>(sections[0]?.id ?? '')

  useEffect(() => {
    markVisited(module.id)
    window.scrollTo(0, 0)
  }, [module.id, markVisited])

  // highlight the progress dot for the section nearest the top of the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [sections])

  const idx = MODULES.findIndex((m) => m.id === module.id)
  const prev = idx > 0 ? MODULES[idx - 1] : null
  const next = idx < MODULES.length - 1 ? MODULES[idx + 1] : null

  return (
    <div style={{ ['--accent' as string]: module.accent }}>
      <header className="sticky top-0 z-20 border-b border-ink-800 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
          <Link
            to="/"
            className="shrink-0 font-mono text-xs text-ink-400 transition-colors hover:text-ink-100"
          >
            ← map
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">
            <span className="accent-text mr-2 font-mono text-xs">M{module.num}</span>
            {module.title}
          </h1>
          <nav className="hidden items-center gap-1.5 sm:flex" aria-label="Sections">
            {sections.map((s) => (
              <button
                key={s.id}
                title={s.label}
                aria-label={`Go to ${s.label}`}
                onClick={() =>
                  document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })
                }
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  active === s.id ? 'accent-bg' : 'bg-ink-700 hover:bg-ink-600'
                }`}
              />
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-16">{children}</main>

      <footer className="border-t border-ink-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-6">
          {prev ? (
            <button
              onClick={() => navigate(prev.path)}
              className="text-sm text-ink-400 transition-colors hover:text-ink-100"
            >
              ← M{prev.num} · {prev.shortTitle}
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button
              onClick={() => navigate(next.path)}
              className="text-sm text-ink-400 transition-colors hover:text-ink-100"
            >
              M{next.num} · {next.shortTitle} →
            </button>
          ) : (
            <Link to="/" className="text-sm text-ink-400 transition-colors hover:text-ink-100">
              Back to the map →
            </Link>
          )}
        </div>
      </footer>
    </div>
  )
}

/** Standard module intro block: title + one-line framing. */
export function ModuleIntro({ module, children }: { module: ModuleMeta; children: ReactNode }) {
  return (
    <div className="pt-10 pb-2">
      <p className="accent-text font-mono text-sm">Module {module.num}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{module.title}</h1>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-300">{children}</p>
    </div>
  )
}
