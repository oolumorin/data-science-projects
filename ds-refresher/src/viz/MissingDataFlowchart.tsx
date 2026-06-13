import { useState } from 'react'
import { VizPanel } from '../components/ConceptCard'

interface Choice {
  label: string
  to: string
}

interface Node {
  id: string
  question?: string
  /** leaf recommendation */
  recommendation?: string
  rationale?: string
  choices?: Choice[]
}

const NODES: Record<string, Node> = {
  start: {
    id: 'start',
    question: 'Is the column numeric?',
    choices: [
      { label: 'Yes', to: 'numeric-pct' },
      { label: 'No (categorical)', to: 'cat-pct' },
    ],
  },
  'numeric-pct': {
    id: 'numeric-pct',
    question: 'Is more than 30% of the column missing?',
    choices: [
      { label: 'Yes', to: 'drop-column-numeric' },
      { label: 'No', to: 'numeric-mar' },
    ],
  },
  'numeric-mar': {
    id: 'numeric-mar',
    question: 'Is the data missing (roughly) at random?',
    choices: [
      { label: 'Yes', to: 'numeric-impute' },
      { label: 'No — missingness depends on other columns', to: 'predictive-impute' },
    ],
  },
  'cat-pct': {
    id: 'cat-pct',
    question: 'Is more than 30% of the column missing?',
    choices: [
      { label: 'Yes', to: 'drop-column-cat' },
      { label: 'No', to: 'cat-mar' },
    ],
  },
  'cat-mar': {
    id: 'cat-mar',
    question: 'Is the data missing (roughly) at random?',
    choices: [
      { label: 'Yes', to: 'mode-impute' },
      { label: 'No — missingness depends on other columns', to: 'predictive-impute' },
    ],
  },
  'drop-column-numeric': {
    id: 'drop-column-numeric',
    recommendation: 'Drop the column',
    rationale: 'With >30% missing, imputed values would dominate the column — usually not worth keeping.',
  },
  'drop-column-cat': {
    id: 'drop-column-cat',
    recommendation: 'Drop the column',
    rationale: 'Same logic for categories: too sparse to impute reliably without distorting the distribution.',
  },
  'numeric-impute': {
    id: 'numeric-impute',
    recommendation: 'Impute with the mean (or median if skewed)',
    rationale: 'Random missingness in a small fraction of rows means a central value preserves the distribution well.',
  },
  'mode-impute': {
    id: 'mode-impute',
    recommendation: 'Impute with the mode',
    rationale: 'For categorical data, the most frequent category is the safest "neutral" fill when missingness is random.',
  },
  'predictive-impute': {
    id: 'predictive-impute',
    recommendation: 'Predictive imputation (model the missing values from other columns)',
    rationale: 'When missingness correlates with other features, a simple mean/mode fill would bias the data — predict the value instead.',
  },
}

const ROOT = 'start'

export function MissingDataFlowchart() {
  const [path, setPath] = useState<string[]>([ROOT])
  const current = path[path.length - 1]
  const node = NODES[current]
  const isLeaf = !!node.recommendation

  const choose = (to: string) => setPath((p) => [...p, to])
  const restart = () => setPath([ROOT])

  // build a simple vertical tree layout of visited path + current options
  const visited = path.map((id) => NODES[id])

  return (
    <VizPanel
      readout={
        <span>
          path: {visited.map((n) => n.question ?? n.recommendation).join(' → ')}
        </span>
      }
      controls={
        <button
          onClick={restart}
          className="rounded-md border border-ink-700 px-3 py-1.5 font-mono text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
        >
          ↺ restart
        </button>
      }
    >
      <div className="space-y-3">
        {visited.map((n, i) => (
          <div
            key={n.id}
            className="rounded-lg border p-3 transition-all duration-300"
            style={{
              borderColor: i === visited.length - 1 ? 'var(--accent)' : 'var(--color-ink-700)',
              background: i === visited.length - 1 ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--color-ink-950)',
            }}
          >
            {n.question && <p className="text-sm font-medium">{n.question}</p>}
            {n.recommendation && (
              <>
                <p className="accent-text text-sm font-semibold">→ {n.recommendation}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-400">{n.rationale}</p>
              </>
            )}
          </div>
        ))}
        {!isLeaf && (
          <div className="flex flex-wrap gap-2">
            {node.choices!.map((c) => (
              <button
                key={c.to}
                onClick={() => choose(c.to)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    choose(c.to)
                  }
                }}
                className="rounded-md border border-ink-700 px-3 py-1.5 text-sm text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-100"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </VizPanel>
  )
}
