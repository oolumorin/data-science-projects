import { useCallback, useEffect, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface StepPlayerProps {
  /** total number of steps; current step is controlled by the parent */
  totalSteps: number
  step: number
  onStepChange: (step: number) => void
  /** ms per step at 1× speed */
  stepDuration?: number
  /** label for the current step, e.g. "assign points" */
  stepLabel?: string
  /** stop playing automatically at the last step (default true) */
  stopAtEnd?: boolean
}

/**
 * Transport controls for any step-through animation: play/pause, step
 * forward/back, reset, speed. Never autoplays — playback is always
 * user-initiated, and reduced-motion users get instant (non-eased) steps
 * via the global CSS rule.
 */
export function StepPlayer({
  totalSteps,
  step,
  onStepChange,
  stepDuration = 900,
  stepLabel,
  stopAtEnd = true,
}: StepPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const reduced = useReducedMotion()

  const atEnd = step >= totalSteps - 1

  // Drive the timer off the current `step`: each advance re-arms a fresh
  // timeout, so there's no ref-during-render and no stale closure. At the end
  // we either stop (stopAtEnd) or loop, handled inside the timeout callback.
  useEffect(() => {
    if (!playing) return
    const id = setTimeout(() => {
      const next = step + 1
      if (next >= totalSteps) {
        if (stopAtEnd) setPlaying(false)
        else onStepChange(0)
      } else {
        onStepChange(next)
      }
    }, stepDuration / speed)
    return () => clearTimeout(id)
  }, [playing, speed, stepDuration, totalSteps, stopAtEnd, step, onStepChange])

  const btn =
    'rounded-md border border-ink-700 px-2.5 py-1 font-mono text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100 disabled:opacity-40 disabled:hover:border-ink-700 disabled:hover:text-ink-300'

  const reset = useCallback(() => {
    setPlaying(false)
    onStepChange(0)
  }, [onStepChange])

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Animation controls">
      <button className={btn} onClick={reset} aria-label="Reset">
        ⏮ reset
      </button>
      <button
        className={btn}
        onClick={() => onStepChange(Math.max(0, step - 1))}
        disabled={step === 0}
        aria-label="Step back"
      >
        ‹ step
      </button>
      <button
        className={`${btn} accent-text min-w-[5.5rem]`}
        onClick={() => {
          if (atEnd && stopAtEnd) {
            onStepChange(0)
            setPlaying(true)
          } else {
            setPlaying((p) => !p)
          }
        }}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? '❚❚ pause' : atEnd && stopAtEnd ? '↻ replay' : '▶ play'}
      </button>
      <button
        className={btn}
        onClick={() => onStepChange(Math.min(totalSteps - 1, step + 1))}
        disabled={atEnd}
        aria-label="Step forward"
      >
        step ›
      </button>
      {!reduced && (
        <button
          className={btn}
          onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 0.5 : 1))}
          aria-label={`Speed ${speed}x`}
        >
          {speed}×
        </button>
      )}
      <span className="ml-auto font-mono text-xs text-ink-400">
        {stepLabel ? `${stepLabel} · ` : ''}
        {Math.min(step + 1, totalSteps)}/{totalSteps}
      </span>
    </div>
  )
}
