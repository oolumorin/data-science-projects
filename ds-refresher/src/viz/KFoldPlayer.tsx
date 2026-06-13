import { useMemo, useState } from 'react'
import { VizPanel } from '../components/ConceptCard'
import { StepPlayer } from '../components/StepPlayer'
import { mean, std } from '../lib/stats'

const N_CELLS = 25
const N_FOLDS = 5
const FOLD_SIZE = N_CELLS / N_FOLDS

// plausible per-fold R² scores for a degree-3 fit on the overfit-lab-style data —
// stable, illustrative numbers (not recomputed live, as the brief allows).
const FOLD_SCORES = [0.82, 0.79, 0.85, 0.74, 0.81]

const CELL = 26
const GAP = 3

export function KFoldPlayer() {
  // step 0..4 = which fold is held out as the validation fold
  const [step, setStep] = useState(0)

  const accumulated = useMemo(() => FOLD_SCORES.slice(0, step + 1), [step])
  const meanScore = useMemo(() => mean(accumulated), [accumulated])
  const stdScore = useMemo(
    () => (accumulated.length > 1 ? std(accumulated) : 0),
    [accumulated],
  )
  const allDone = step === N_FOLDS - 1

  return (
    <VizPanel
      controls={
        <StepPlayer
          totalSteps={N_FOLDS}
          step={step}
          onStepChange={setStep}
          stepLabel={`fold ${step + 1} held out`}
        />
      }
      readout={
        <>
          <span>
            held-out fold <span className="accent-text">{step + 1}</span> / {N_FOLDS}
          </span>
          <span>
            R² this fold ={' '}
            <span className="text-ink-100">{FOLD_SCORES[step].toFixed(2)}</span>
          </span>
          <span>
            mean so far ={' '}
            <span className="text-ink-100">{meanScore.toFixed(3)}</span>
            {step > 0 && <> ± {stdScore.toFixed(3)}</>}
          </span>
        </>
      }
    >
      <svg viewBox="0 0 460 130" className="w-full" role="img" aria-label="5-fold cross-validation strip">
        {/* the 25-cell strip, split into 5 fold blocks */}
        {Array.from({ length: N_CELLS }, (_, i) => {
          const fold = Math.floor(i / FOLD_SIZE)
          const isHeld = fold === step
          const x = 10 + i * (CELL + GAP)
          return (
            <rect
              key={i}
              x={x}
              y={10}
              width={CELL}
              height={CELL}
              rx={3}
              fill={isHeld ? 'var(--accent)' : 'var(--color-ink-700)'}
              opacity={isHeld ? 0.9 : 0.45}
              className="transition-all duration-300"
            />
          )
        })}
        {/* fold labels */}
        {Array.from({ length: N_FOLDS }, (_, f) => {
          const x = 10 + f * FOLD_SIZE * (CELL + GAP) + (FOLD_SIZE * (CELL + GAP)) / 2 - GAP / 2
          const isHeld = f === step
          return (
            <text
              key={f}
              x={x}
              y={64}
              textAnchor="middle"
              fontSize={11}
              fontFamily="var(--font-mono)"
              fill={isHeld ? 'var(--accent)' : 'var(--color-ink-400)'}
              fontWeight={isHeld ? 'bold' : 'normal'}
            >
              fold {f + 1}{isHeld ? ' (val)' : ''}
            </text>
          )
        })}

        <text x={10} y={90} fontSize={10} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
          train on dimmed folds → validate on highlighted fold
        </text>

        {/* accumulated scores list */}
        {accumulated.map((s, i) => (
          <g key={i} transform={`translate(${10 + i * 70}, 108)`}>
            <rect width={64} height={20} rx={4} fill="var(--color-ink-800)" stroke={i === step ? 'var(--accent)' : 'var(--color-ink-700)'} />
            <text x={32} y={14} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="var(--color-ink-100)">
              R²={s.toFixed(2)}
            </text>
          </g>
        ))}
      </svg>

      {allDone && (
        <div className="mt-3 rounded-lg border border-good/40 bg-good/5 p-3 font-mono text-sm">
          <span className="text-good">CV result:</span>{' '}
          mean R² = {meanScore.toFixed(3)} ± {stdScore.toFixed(3)} (across {N_FOLDS} folds)
        </div>
      )}
    </VizPanel>
  )
}
