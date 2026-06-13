import { createContext, useContext } from 'react'

const STORAGE_KEY = 'ds-refresher/progress/v1'

export interface ModuleProgress {
  visited: boolean
  /** best quiz score as a fraction 0–1; undefined until first attempt */
  bestScore?: number
  attempts: number
}

export interface ProgressState {
  modules: Record<string, ModuleProgress>
}

export const emptyProgress: ProgressState = { modules: {} }

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress
    const parsed = JSON.parse(raw) as ProgressState
    if (!parsed || typeof parsed.modules !== 'object') return emptyProgress
    return parsed
  } catch {
    return emptyProgress
  }
}

export function saveProgress(state: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full or unavailable — progress just won't persist
  }
}

export interface ProgressApi {
  progress: ProgressState
  markVisited: (moduleId: string) => void
  recordQuizScore: (moduleId: string, score: number) => void
  moduleProgress: (moduleId: string) => ModuleProgress
}

export const ProgressContext = createContext<ProgressApi | null>(null)

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within <ProgressProvider>')
  return ctx
}

export const PASS_THRESHOLD = 0.8
