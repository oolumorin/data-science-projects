import { useState } from 'react'
import { VizPanel } from '../components/ConceptCard'
import { StepPlayer } from '../components/StepPlayer'

const ROWS = ['gas', 'diesel', 'electric', 'gas', 'electric', 'diesel']
const CATEGORIES = ['gas', 'diesel', 'electric'] as const

const TOTAL_STEPS = 2 // 0 = single column, 1 = split into dummies

export function OneHotViz() {
  const [step, setStep] = useState(0)
  const split = step === 1

  return (
    <VizPanel controls={<StepPlayer totalSteps={TOTAL_STEPS} step={step} onStepChange={setStep} stepLabel={split ? 'one-hot encoded' : 'original column'} />}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-sm">
          <thead>
            <tr>
              <th className="border-b border-ink-700 px-3 py-2 text-left text-ink-400">row</th>
              <th className="border-b border-ink-700 px-3 py-2 text-left text-ink-400 transition-opacity duration-300" style={{ opacity: split ? 0.3 : 1 }}>
                fuel
              </th>
              {CATEGORIES.map((c) => (
                <th
                  key={c}
                  className="border-b border-ink-700 px-3 py-2 text-left transition-all duration-300"
                  style={{
                    opacity: split ? 1 : 0,
                    color: 'var(--accent)',
                    width: split ? undefined : 0,
                  }}
                >
                  fuel_{c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((fuel, i) => (
              <tr key={i}>
                <td className="border-b border-ink-800 px-3 py-2 text-ink-400">{i}</td>
                <td className="border-b border-ink-800 px-3 py-2 transition-opacity duration-300" style={{ opacity: split ? 0.3 : 1 }}>
                  {fuel}
                </td>
                {CATEGORIES.map((c) => {
                  const val = fuel === c ? 1 : 0
                  return (
                    <td
                      key={c}
                      className="border-b border-ink-800 px-3 py-2 transition-all duration-300"
                      style={{ opacity: split ? 1 : 0 }}
                    >
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded transition-colors duration-300"
                        style={{
                          background: split && val === 1 ? 'var(--accent)' : 'transparent',
                          color: split && val === 1 ? 'var(--color-ink-950)' : 'var(--color-ink-400)',
                        }}
                      >
                        {val}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VizPanel>
  )
}
