import { useState } from 'react'
import { VizPanel } from '../components/ConceptCard'

interface Block {
  id: string
  name: string
  code: string
  explanation: string
}

const BLOCKS: Block[] = [
  {
    id: 'scale',
    name: 'StandardScaler',
    code: "('scale', StandardScaler())",
    explanation:
      'Centers and scales each feature to mean 0, variance 1. Many models (and ridge\'s penalty in particular) are sensitive to feature scale — without this, large-magnitude features dominate the penalty unfairly.',
  },
  {
    id: 'poly',
    name: 'PolynomialFeatures',
    code: "('poly', PolynomialFeatures(2))",
    explanation:
      'Expands features into polynomial combinations (x, x², x₁x₂, …), letting a linear model fit curved relationships. It must come after scaling — squaring raw large values would explode the feature range.',
  },
  {
    id: 'model',
    name: 'Ridge',
    code: "('model', Ridge(alpha=0.1))",
    explanation:
      'The estimator at the end of the pipeline. Ridge fits a linear model with an L2 penalty on the (now scaled, expanded) features — shrinking coefficients to control overfitting.',
  },
]

export function PipelineDiagram() {
  const [selected, setSelected] = useState<string | null>(null)
  const block = BLOCKS.find((b) => b.id === selected)

  return (
    <VizPanel
      readout={
        <span>
          fit() learns parameters from training data; transform() applies them — a pipeline
          chains transform → transform → fit/predict in order.
        </span>
      }
    >
      <svg viewBox="0 0 460 140" className="w-full" role="img" aria-label="Pipeline diagram: StandardScaler, PolynomialFeatures, Ridge">
        <defs>
          <marker id="pipe-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L8,4 L0,8 z" fill="var(--color-ink-600)" />
          </marker>
        </defs>

        {/* input label */}
        <text x={5} y={75} fontSize={11} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
          X, y
        </text>

        {BLOCKS.map((b, i) => {
          const x = 48 + i * 140
          const isSel = selected === b.id
          return (
            <g key={b.id}>
              {i > 0 && (
                <path
                  d={`M ${x - 92} 70 L ${x - 12} 70`}
                  stroke="var(--color-ink-600)"
                  strokeWidth={1.5}
                  markerEnd="url(#pipe-arrow)"
                  fill="none"
                >
                  <animate attributeName="stroke-dashoffset" from="12" to="0" dur="0.8s" repeatCount="indefinite" />
                </path>
              )}
              <rect
                x={x - 8}
                y={40}
                width={108}
                height={60}
                rx={8}
                fill={isSel ? 'var(--accent)' : 'var(--color-ink-800)'}
                stroke={isSel ? 'var(--accent)' : 'var(--color-ink-600)'}
                strokeWidth={isSel ? 2 : 1}
                className="cursor-pointer transition-all duration-200"
                tabIndex={0}
                role="button"
                aria-pressed={isSel}
                aria-label={`${b.name} block`}
                onClick={() => setSelected((s) => (s === b.id ? null : b.id))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected((s) => (s === b.id ? null : b.id))
                  }
                }}
              />
              <text
                x={x + 46}
                y={75}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fontFamily="var(--font-mono)"
                fontWeight="bold"
                fill={isSel ? 'var(--color-ink-950)' : 'var(--color-ink-100)'}
                pointerEvents="none"
              >
                {b.name}
              </text>
              <text x={x + 46} y={118} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
                step {i + 1}
              </text>
            </g>
          )
        })}

        {/* output arrow */}
        <path d="M 416 70 L 450 70" stroke="var(--color-ink-600)" strokeWidth={1.5} markerEnd="url(#pipe-arrow)" />
        <text x={415} y={30} fontSize={10} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
          ŷ
        </text>
      </svg>

      {block ? (
        <div className="mt-3 rounded-lg border border-ink-700 bg-ink-950 p-3">
          <p className="font-mono text-xs accent-text">{block.code}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-300">{block.explanation}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-400">
          Click a block to see what it does and why the order matters.
        </p>
      )}
    </VizPanel>
  )
}
