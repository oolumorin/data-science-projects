import { useState } from 'react'
import { VizPanel } from '../components/ConceptCard'

interface Stage {
  name: string
  short: string
  question: string
  outputs: string
  /** indices of earlier stages this one commonly loops back to */
  loopBack: number[]
}

const STAGES: Stage[] = [
  {
    name: 'Business Understanding',
    short: 'Business',
    question: 'What problem am I actually trying to solve?',
    outputs: 'A clearly stated problem and the goals that define success.',
    loopBack: [],
  },
  {
    name: 'Analytic Approach',
    short: 'Approach',
    question: 'How can I use data to answer this question?',
    outputs: 'The type of model: descriptive, diagnostic, predictive, or prescriptive.',
    loopBack: [0],
  },
  {
    name: 'Data Requirements',
    short: 'Requirements',
    question: 'What data do I need — content, formats, sources?',
    outputs: 'A shopping list of variables and where they should come from.',
    loopBack: [],
  },
  {
    name: 'Data Collection',
    short: 'Collection',
    question: 'Where is the data, and how do I get it?',
    outputs: 'Raw data gathered from databases, APIs, files, or scraping.',
    loopBack: [2],
  },
  {
    name: 'Data Understanding',
    short: 'Understanding',
    question: 'Is the data representative of the problem?',
    outputs: 'Descriptive stats and visual checks; gaps may send you back to collect more.',
    loopBack: [3],
  },
  {
    name: 'Data Preparation',
    short: 'Preparation',
    question: 'What cleaning and feature engineering does the data need?',
    outputs: 'The analysis-ready dataset. Often 60–80% of total project time.',
    loopBack: [],
  },
  {
    name: 'Modeling',
    short: 'Modeling',
    question: 'Does the model answer the question, or does it need tuning?',
    outputs: 'Trained candidate model(s) built from the prepared data.',
    loopBack: [5],
  },
  {
    name: 'Evaluation',
    short: 'Evaluation',
    question: 'Does the model meet the quality bar before deployment?',
    outputs: 'Quality metrics and a go/no-go; failures loop back to modeling or the approach.',
    loopBack: [6, 1],
  },
  {
    name: 'Deployment',
    short: 'Deployment',
    question: 'How do stakeholders actually use the model?',
    outputs: 'The model in production — a report, an API, a dashboard.',
    loopBack: [],
  },
  {
    name: 'Feedback',
    short: 'Feedback',
    question: 'Is the model still working in the real world?',
    outputs: 'Live performance data that refines the problem itself — the loop closes.',
    loopBack: [0, 5],
  },
]

const CX = 230
const CY = 200
const R = 150

function nodePos(i: number): [number, number] {
  const angle = (i / STAGES.length) * Math.PI * 2 - Math.PI / 2
  return [CX + R * Math.cos(angle), CY + R * Math.sin(angle)]
}

/** Inner curved arc from stage a back to stage b. */
function loopArc(a: number, b: number): string {
  const [x1, y1] = nodePos(a)
  const [x2, y2] = nodePos(b)
  // pull control point toward the center for an inner arc
  const mx = (x1 + x2) / 2 + (CX - (x1 + x2) / 2) * 0.75
  const my = (y1 + y2) / 2 + (CY - (y1 + y2) / 2) * 0.75
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`
}

export function MethodologyLoop({
  litStages,
  compact = false,
}: {
  /** optionally light specific stages (capstone retrospective reuse) */
  litStages?: number[]
  compact?: boolean
}) {
  const [selected, setSelected] = useState(0)
  const stage = STAGES[selected]

  return (
    <VizPanel>
      <div className={compact ? '' : 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]'}>
        <svg
          viewBox="0 0 460 400"
          role="group"
          aria-label="IBM 10-stage methodology loop"
          className="mx-auto w-full max-w-[480px]"
        >
          <defs>
            <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8 z" fill="var(--color-ink-600)" />
            </marker>
            <marker id="arrow-accent" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L8,4 L0,8 z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* forward flow around the circle */}
          {STAGES.map((_, i) => {
            const next = (i + 1) % STAGES.length
            const a1 = (i / STAGES.length) * Math.PI * 2 - Math.PI / 2
            const a2 = (next / STAGES.length) * Math.PI * 2 - Math.PI / 2
            const pad = 0.13
            const x1 = CX + R * Math.cos(a1 + pad)
            const y1 = CY + R * Math.sin(a1 + pad)
            const x2 = CX + R * Math.cos(a2 - pad)
            const y2 = CY + R * Math.sin(a2 - pad)
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke="var(--color-ink-600)"
                strokeWidth={1.5}
                markerEnd="url(#arrow)"
              />
            )
          })}

          {/* loop-back arcs for the selected stage */}
          {stage.loopBack.map((b) => (
            <path
              key={b}
              d={loopArc(selected, b)}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={1.8}
              strokeDasharray="6 4"
              markerEnd="url(#arrow-accent)"
              opacity={0.9}
            >
              <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.2s" repeatCount="indefinite" />
            </path>
          ))}

          {/* stage nodes */}
          {STAGES.map((s, i) => {
            const [x, y] = nodePos(i)
            const isSel = i === selected
            const lit = litStages?.includes(i)
            return (
              <g key={s.name}>
                <circle
                  cx={x}
                  cy={y}
                  r={20}
                  fill={isSel || lit ? 'var(--accent)' : 'var(--color-ink-800)'}
                  stroke={isSel ? 'var(--accent)' : 'var(--color-ink-600)'}
                  strokeWidth={isSel ? 2 : 1}
                  opacity={lit && !isSel ? 0.65 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => setSelected(i)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${s.name}${isSel ? ' (selected)' : ''}`}
                  aria-pressed={isSel}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelected(i)
                    }
                  }}
                />
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                  fill={isSel || lit ? 'var(--color-ink-950)' : 'var(--color-ink-300)'}
                  pointerEvents="none"
                >
                  {i + 1}
                </text>
                <text
                  x={x + (x - CX) * 0.26}
                  y={y + (y - CY) * 0.26 + 3}
                  textAnchor="middle"
                  fontSize={10.5}
                  fill={isSel ? 'var(--accent)' : 'var(--color-ink-400)'}
                  pointerEvents="none"
                >
                  {s.short}
                </text>
              </g>
            )
          })}
        </svg>

        {!compact && (
          <aside className="rounded-lg border border-ink-800 bg-ink-950 p-4" aria-live="polite">
            <p className="font-mono text-xs text-ink-400">stage {selected + 1} of 10</p>
            <h3 className="mt-1 font-semibold">{stage.name}</h3>
            <p className="accent-text mt-3 text-sm italic leading-relaxed">“{stage.question}”</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-300">{stage.outputs}</p>
            {stage.loopBack.length > 0 && (
              <p className="mt-3 text-xs leading-relaxed text-ink-400">
                ↩ loops back to{' '}
                {stage.loopBack.map((b) => STAGES[b].name).join(' and ')}
              </p>
            )}
          </aside>
        )}
      </div>
    </VizPanel>
  )
}
