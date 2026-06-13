import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  ProgressContext,
  loadProgress,
  saveProgress,
  type ModuleProgress,
  type ProgressState,
} from './useProgress'

const blank: ModuleProgress = { visited: false, attempts: 0 }

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(loadProgress)

  const update = useCallback((fn: (prev: ProgressState) => ProgressState) => {
    setProgress((prev) => {
      const next = fn(prev)
      saveProgress(next)
      return next
    })
  }, [])

  const markVisited = useCallback(
    (moduleId: string) => {
      update((prev) => {
        if (prev.modules[moduleId]?.visited) return prev
        return {
          modules: {
            ...prev.modules,
            [moduleId]: { ...blank, ...prev.modules[moduleId], visited: true },
          },
        }
      })
    },
    [update],
  )

  const recordQuizScore = useCallback(
    (moduleId: string, score: number) => {
      update((prev) => {
        const cur = prev.modules[moduleId] ?? blank
        return {
          modules: {
            ...prev.modules,
            [moduleId]: {
              ...cur,
              visited: true,
              attempts: cur.attempts + 1,
              bestScore: Math.max(cur.bestScore ?? 0, score),
            },
          },
        }
      })
    },
    [update],
  )

  const moduleProgress = useCallback(
    (moduleId: string) => progress.modules[moduleId] ?? blank,
    [progress],
  )

  const api = useMemo(
    () => ({ progress, markVisited, recordQuizScore, moduleProgress }),
    [progress, markVisited, recordQuizScore, moduleProgress],
  )

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>
}
