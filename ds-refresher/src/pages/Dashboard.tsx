import { Link } from 'react-router-dom'
import { MODULES } from '../lib/modules'
import { useProgress, PASS_THRESHOLD } from '../hooks/useProgress'

export function Dashboard() {
  const { moduleProgress } = useProgress()

  const passedCount = MODULES.filter(
    (m) => (moduleProgress(m.id).bestScore ?? 0) >= PASS_THRESHOLD,
  ).length
  const pct = Math.round((passedCount / MODULES.length) * 100)

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16">
      <header className="pt-12 pb-8">
        <p className="font-mono text-sm text-ink-400">IBM Data Science Professional Certificate · 2019</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          Data Science <span className="text-ink-400">Visual Refresher</span>
        </h1>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-300">
          Eight modules, every concept taught by an interactive you can drag, step through, and
          break. Pass each quiz at ≥80% to light up the loop.
        </p>

        <div className="mt-6 max-w-md">
          <div className="flex items-center justify-between text-xs text-ink-400">
            <span>
              {passedCount}/{MODULES.length} modules mastered
            </span>
            <span className="font-mono">{pct}%</span>
          </div>
          <div
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-800"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall progress"
          >
            <div
              className="h-full rounded-full bg-good transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((m) => {
          const prog = moduleProgress(m.id)
          const best = prog.bestScore
          const passed = (best ?? 0) >= PASS_THRESHOLD
          return (
            <Link
              key={m.id}
              to={m.path}
              style={{ ['--accent' as string]: m.accent }}
              className="group relative flex min-h-[150px] flex-col rounded-xl border border-ink-700 bg-ink-900 p-4 transition-all hover:-translate-y-0.5 hover:border-ink-500"
            >
              <div className="flex items-start justify-between">
                <span
                  className="accent-text font-mono text-xs font-semibold"
                  style={{ color: m.accent }}
                >
                  M{m.num}
                </span>
                {passed ? (
                  <span className="text-xs text-good" title="Quiz passed">
                    ✓ {Math.round((best ?? 0) * 100)}%
                  </span>
                ) : best !== undefined ? (
                  <span className="font-mono text-xs text-warn">{Math.round(best * 100)}%</span>
                ) : prog.visited ? (
                  <span className="text-xs text-ink-400" title="Visited">
                    ○ visited
                  </span>
                ) : null}
              </div>
              <h2 className="mt-2 text-[15px] font-semibold leading-snug">{m.title}</h2>
              <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-400">{m.blurb}</p>
              <div className="mt-auto flex items-center justify-between pt-3">
                <span className="font-mono text-[11px] text-ink-400">~{m.estMinutes} min</span>
                <span
                  className="h-1.5 w-10 rounded-full"
                  style={{ backgroundColor: m.accent }}
                  aria-hidden
                />
              </div>
            </Link>
          )
        })}
      </div>

      <footer className="mt-12 border-t border-ink-800 pt-6 text-xs leading-relaxed text-ink-400">
        <p>
          Built as a personal refresher for the 9-course IBM certificate (Coursera, 2019). Visual
          first · ≤150 words of prose per concept · quizzes verify retention. Progress lives in
          this browser only.
        </p>
      </footer>
    </main>
  )
}
