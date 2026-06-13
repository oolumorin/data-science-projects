import { useState } from 'react'
import { VizPanel } from '../components/ConceptCard'

type Approach = 'Descriptive' | 'Diagnostic' | 'Predictive' | 'Prescriptive'

const APPROACHES: { name: Approach; hint: string; model: string }[] = [
  { name: 'Descriptive', hint: 'What is happening?', model: 'current status, clustering, summaries' },
  { name: 'Diagnostic', hint: 'Why is it happening?', model: 'statistical analysis, correlation' },
  { name: 'Predictive', hint: 'What will happen?', model: 'regression, classification, forecasting' },
  { name: 'Prescriptive', hint: 'What should we do?', model: 'optimization, recommendation' },
]

interface Scenario {
  question: string
  answer: Approach
  why: string
}

const SCENARIOS: Scenario[] = [
  {
    question: 'Which of our customers are likely to churn next quarter?',
    answer: 'Predictive',
    why: 'Forecasting a future outcome (churn / no churn) is a predictive question — a classification model fits.',
  },
  {
    question: 'How many patients visited each clinic last month, by age group?',
    answer: 'Descriptive',
    why: 'Summarizing what is currently happening — counts and breakdowns — is descriptive analytics.',
  },
  {
    question: 'Why did sales drop 18% in the Atlantic region in March?',
    answer: 'Diagnostic',
    why: '“Why did it happen?” is diagnostic — drilling into correlations and contributing factors.',
  },
  {
    question: 'What discount should we offer each customer segment to maximize revenue?',
    answer: 'Prescriptive',
    why: 'Recommending an action to take — optimizing a decision — is prescriptive analytics.',
  },
  {
    question: 'Can we group neighborhoods into natural segments by venue mix?',
    answer: 'Descriptive',
    why: 'Clustering finds structure in what exists today, with no target to predict — descriptive. (This was the 2019 capstone!)',
  },
  {
    question: 'What will next month’s emergency-room demand be?',
    answer: 'Predictive',
    why: 'Estimating a future numeric quantity is predictive — a regression/forecasting problem.',
  },
]

export function ApproachMatcher() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<Approach | null>(null)
  const [score, setScore] = useState({ right: 0, total: 0 })

  const s = SCENARIOS[idx]
  const done = picked !== null

  const pick = (a: Approach) => {
    if (done) return
    setPicked(a)
    setScore((sc) => ({ right: sc.right + (a === s.answer ? 1 : 0), total: sc.total + 1 }))
  }

  return (
    <VizPanel>
      <div className="mb-4 flex items-center justify-between font-mono text-xs text-ink-400">
        <span>
          scenario {idx + 1}/{SCENARIOS.length}
        </span>
        <span>
          {score.right}/{score.total} matched
        </span>
      </div>
      <p className="text-[15px] font-medium leading-relaxed">“{s.question}”</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {APPROACHES.map((a) => {
          let style = 'border-ink-700 hover:border-ink-500'
          if (done) {
            if (a.name === s.answer) style = 'border-good bg-good/10'
            else if (a.name === picked) style = 'border-bad bg-bad/10'
            else style = 'border-ink-800 opacity-60'
          }
          return (
            <button
              key={a.name}
              onClick={() => pick(a.name)}
              disabled={done}
              className={`rounded-lg border p-3 text-left transition-colors ${style}`}
            >
              <span className="text-sm font-semibold">{a.name}</span>
              <span className="accent-text block text-xs italic">{a.hint}</span>
              <span className="mt-1 block font-mono text-[11px] text-ink-400">{a.model}</span>
            </button>
          )
        })}
      </div>
      {done && (
        <div className="mt-4 rounded-lg border border-ink-700 bg-ink-950 p-3">
          <p className="text-sm leading-relaxed text-ink-300">{s.why}</p>
          <button
            onClick={() => {
              setIdx((idx + 1) % SCENARIOS.length)
              setPicked(null)
            }}
            className="accent-text mt-2 rounded-md border border-ink-600 px-3 py-1.5 text-sm transition-colors hover:bg-ink-800"
          >
            {idx + 1 >= SCENARIOS.length ? 'Start over ↻' : 'Next scenario →'}
          </button>
        </div>
      )}
    </VizPanel>
  )
}
