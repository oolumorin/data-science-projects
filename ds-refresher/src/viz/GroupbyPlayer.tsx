import { useMemo, useState } from 'react'
import { VizPanel } from '../components/ConceptCard'
import { StepPlayer } from '../components/StepPlayer'
import { mean } from '../lib/stats'

interface Row {
  city: string
  price: number
}

const DATA: Row[] = [
  { city: 'Austin', price: 320 },
  { city: 'Boston', price: 540 },
  { city: 'Austin', price: 280 },
  { city: 'Denver', price: 410 },
  { city: 'Boston', price: 610 },
  { city: 'Austin', price: 350 },
  { city: 'Denver', price: 390 },
  { city: 'Boston', price: 575 },
  { city: 'Denver', price: 430 },
  { city: 'Austin', price: 300 },
]

const CITIES = ['Austin', 'Boston', 'Denver']
const CITY_COLOR: Record<string, string> = {
  Austin: 'var(--accent)',
  Boston: 'var(--color-m5)',
  Denver: 'var(--color-m6)',
}

const STEPS = ['Original DataFrame', 'Split by city', 'Apply mean(price)', 'Combine into result']

const ROW_H = 28
const COL_W = 100

export function GroupbyPlayer() {
  const [step, setStep] = useState(0)

  // for each row, compute its rank within its city group
  const rankInGroup = useMemo(() => {
    const counters: Record<string, number> = { Austin: 0, Boston: 0, Denver: 0 }
    return DATA.map((row) => {
      const r = counters[row.city]
      counters[row.city] += 1
      return r
    })
  }, [])

  const means = useMemo(() => {
    const m: Record<string, number> = {}
    for (const city of CITIES) {
      const vals = DATA.filter((d) => d.city === city).map((d) => d.price)
      m[city] = mean(vals)
    }
    return m
  }, [])

  const showSplit = step >= 1
  const showApply = step >= 2
  const showCombine = step === 3

  return (
    <VizPanel
      controls={<StepPlayer totalSteps={STEPS.length} step={step} onStepChange={setStep} stepLabel={STEPS[step]} />}
      readout={
        <span>
          {step === 0 && '10 rows, one table — df.groupby("city")'}
          {step === 1 && 'split: rows regrouped by city'}
          {step === 2 && 'apply: mean(price) computed per group'}
          {step === 3 && 'combine: one row per city in the result'}
        </span>
      }
    >
      <svg
        viewBox="0 0 420 340"
        className="w-full max-w-[460px]"
        role="img"
        aria-label="Split-apply-combine animation of groupby city, mean price"
      >
        {/* headers */}
        {showSplit
          ? CITIES.map((city, gi) => (
              <text
                key={city}
                x={(gi + 1) * (COL_W + 14) + COL_W / 2}
                y={14}
                textAnchor="middle"
                fontSize={11}
                fontFamily="var(--font-mono)"
                fill={CITY_COLOR[city]}
                className="transition-all duration-300"
              >
                {city}
              </text>
            ))
          : (
            <text x={COL_W / 2} y={14} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
              city / price
            </text>
          )}

        {/* the 10 rows, translating between original and grouped layouts */}
        {DATA.map((row, i) => {
          const groupIdx = CITIES.indexOf(row.city)
          const origX = 0
          const origY = i * ROW_H + 24
          const groupX = (groupIdx + 1) * (COL_W + 14)
          const groupY = rankInGroup[i] * ROW_H + 24
          const x = showSplit ? groupX : origX
          const y = showSplit ? groupY : origY
          return (
            <g
              key={i}
              className="transition-all duration-500"
              style={{
                transform: `translate(${x}px, ${y}px)`,
                opacity: showCombine ? 0 : 1,
              }}
            >
              <rect
                width={COL_W}
                height={ROW_H - 4}
                rx={4}
                fill={showSplit ? CITY_COLOR[row.city] : 'var(--color-ink-700)'}
                opacity={showSplit ? 0.85 : 0.5}
              />
              <text x={8} y={ROW_H / 2 - 1} dominantBaseline="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--color-ink-100)">
                {row.city} · ${row.price}
              </text>
            </g>
          )
        })}

        {/* apply: mean values appear below each group */}
        {showApply &&
          CITIES.map((city, gi) => {
            const groupSize = DATA.filter((d) => d.city === city).length
            const y = (showCombine ? 0 : groupSize) * ROW_H + 30
            return (
              <g
                key={city}
                className="transition-all duration-500"
                style={{ transform: `translate(${(gi + 1) * (COL_W + 14)}px, ${y}px)` }}
              >
                <rect width={COL_W} height={ROW_H - 4} rx={4} fill={CITY_COLOR[city]} stroke="var(--color-ink-100)" strokeWidth={1.5} />
                <text x={8} y={ROW_H / 2 - 1} dominantBaseline="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--color-ink-950)" fontWeight="bold">
                  mean = {means[city].toFixed(0)}
                </text>
              </g>
            )
          })}

        {/* combine: result table on the left */}
        {showCombine && (
          <text x={0} y={14} fontSize={11} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
            result: city → mean(price)
          </text>
        )}
        {showCombine &&
          CITIES.map((city, gi) => (
            <g key={city} className="transition-all duration-500" style={{ transform: `translate(0px, ${gi * ROW_H + 30}px)` }}>
              <rect width={COL_W + 70} height={ROW_H - 4} rx={4} fill={CITY_COLOR[city]} opacity={0.85} />
              <text x={8} y={ROW_H / 2 - 1} dominantBaseline="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--color-ink-950)" fontWeight="bold">
                {city}: {means[city].toFixed(0)}
              </text>
            </g>
          ))}
      </svg>
    </VizPanel>
  )
}
