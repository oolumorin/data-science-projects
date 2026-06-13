import { useMemo, useState } from 'react'
import { VizPanel } from '../components/ConceptCard'
import { StepPlayer } from '../components/StepPlayer'
import { mean } from '../lib/stats'

interface OrderRow {
  order_id: number
  city: string
  amount: number
}

const ORDERS: OrderRow[] = [
  { order_id: 1, city: 'Austin', amount: 30 },
  { order_id: 2, city: 'Austin', amount: 55 },
  { order_id: 3, city: 'Boston', amount: 120 },
  { order_id: 4, city: 'Boston', amount: 80 },
  { order_id: 5, city: 'Boston', amount: 95 },
  { order_id: 6, city: 'Denver', amount: 15 },
  { order_id: 7, city: 'Denver', amount: 20 },
  { order_id: 8, city: 'Austin', amount: 60 },
  { order_id: 9, city: 'Chicago', amount: 200 },
  { order_id: 10, city: 'Chicago', amount: 5 },
]

// Query (written order):
// SELECT city, AVG(amount) AS avg_amount
// FROM orders
// WHERE amount > 10
// GROUP BY city
// HAVING AVG(amount) > 30
// ORDER BY avg_amount DESC
// LIMIT 2

const QUERY_LINES = [
  { clause: 'SELECT', text: 'SELECT city, AVG(amount) AS avg_amount' },
  { clause: 'FROM', text: 'FROM orders' },
  { clause: 'WHERE', text: 'WHERE amount > 10' },
  { clause: 'GROUP BY', text: 'GROUP BY city' },
  { clause: 'HAVING', text: 'HAVING AVG(amount) > 30' },
  { clause: 'ORDER BY', text: 'ORDER BY avg_amount DESC' },
  { clause: 'LIMIT', text: 'LIMIT 2' },
]

// execution order
const STAGES = [
  { clause: 'FROM', label: 'FROM orders — load all rows' },
  { clause: 'WHERE', label: 'WHERE amount > 10 — filter rows' },
  { clause: 'GROUP BY', label: 'GROUP BY city — collapse into groups' },
  { clause: 'HAVING', label: 'HAVING AVG(amount) > 30 — filter groups' },
  { clause: 'SELECT', label: 'SELECT city, AVG(amount) — project columns' },
  { clause: 'ORDER BY', label: 'ORDER BY avg_amount DESC — sort' },
  { clause: 'LIMIT', label: 'LIMIT 2 — cut to top rows' },
]

interface GroupAgg {
  city: string
  avg_amount: number
  count: number
}

function computeStageData() {
  // step 0: FROM
  const fromRows = ORDERS

  // step 1: WHERE
  const whereRows = fromRows.filter((r) => r.amount > 10)

  // step 2: GROUP BY
  const cities = Array.from(new Set(whereRows.map((r) => r.city)))
  const groups: Record<string, OrderRow[]> = {}
  for (const c of cities) groups[c] = whereRows.filter((r) => r.city === c)

  // step 3: HAVING
  const aggs: GroupAgg[] = cities.map((c) => ({
    city: c,
    avg_amount: mean(groups[c].map((r) => r.amount)),
    count: groups[c].length,
  }))
  const havingAggs = aggs.filter((a) => a.avg_amount > 30)

  // step 4: SELECT (already shaped as city, avg_amount)
  const selectAggs = havingAggs.map((a) => ({ city: a.city, avg_amount: a.avg_amount }))

  // step 5: ORDER BY
  const orderedAggs = [...selectAggs].sort((a, b) => b.avg_amount - a.avg_amount)

  // step 6: LIMIT 2
  const limitedAggs = orderedAggs.slice(0, 2)

  return { fromRows, whereRows, groups, cities, aggs, havingAggs, selectAggs, orderedAggs, limitedAggs }
}

const CITY_COLOR: Record<string, string> = {
  Austin: 'var(--accent)',
  Boston: 'var(--color-m5)',
  Denver: 'var(--color-m6)',
  Chicago: 'var(--color-m4)',
}

export function QueryPipeline() {
  const [step, setStep] = useState(0)
  const data = useMemo(() => computeStageData(), [])
  const activeClause = STAGES[step].clause

  return (
    <VizPanel
      controls={<StepPlayer totalSteps={STAGES.length} step={step} onStepChange={setStep} stepLabel={STAGES[step].label} stepDuration={1200} />}
      readout={<span>{STAGES[step].label}</span>}
    >
      {/* written query with the executing clause highlighted */}
      <pre className="mb-4 overflow-x-auto rounded-lg border border-ink-700 bg-ink-950 p-3 font-mono text-xs leading-relaxed">
        {QUERY_LINES.map((line, i) => (
          <div
            key={i}
            className={`rounded px-1 transition-colors duration-300 ${
              line.clause === activeClause ? 'bg-ink-700/60 text-ink-100' : 'text-ink-400'
            }`}
          >
            {line.text}
          </div>
        ))}
      </pre>

      {/* execution order strip */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {STAGES.map((s, i) => (
          <button
            key={s.clause}
            onClick={() => setStep(i)}
            className={`rounded-md border px-2 py-1 font-mono text-[10px] transition-colors ${
              i === step
                ? 'accent-border accent-text border bg-ink-800'
                : i < step
                  ? 'border-ink-700 text-ink-400'
                  : 'border-ink-800 text-ink-600'
            }`}
            aria-pressed={i === step}
          >
            {i + 1}. {s.clause}
          </button>
        ))}
      </div>

      {/* row visualization */}
      <div className="overflow-x-auto">
        {step === 0 && (
          <RowTable
            rows={data.fromRows.map((r) => ({ key: r.order_id, cells: [r.order_id, r.city, r.amount], filtered: false, color: CITY_COLOR[r.city] }))}
            cols={['order_id', 'city', 'amount']}
          />
        )}
        {step === 1 && (
          <RowTable
            rows={ORDERS.map((r) => ({
              key: r.order_id,
              cells: [r.order_id, r.city, r.amount],
              filtered: r.amount <= 10,
              color: CITY_COLOR[r.city],
            }))}
            cols={['order_id', 'city', 'amount']}
          />
        )}
        {step === 2 && (
          <div className="flex flex-wrap gap-3">
            {data.cities.map((c) => (
              <div key={c} className="rounded-lg border p-2" style={{ borderColor: CITY_COLOR[c] }}>
                <p className="mb-1 font-mono text-[11px]" style={{ color: CITY_COLOR[c] }}>
                  {c} ({data.groups[c].length} rows)
                </p>
                <RowTable
                  rows={data.groups[c].map((r) => ({ key: r.order_id, cells: [r.order_id, r.amount], filtered: false, color: CITY_COLOR[c] }))}
                  cols={['order_id', 'amount']}
                />
              </div>
            ))}
          </div>
        )}
        {step === 3 && (
          <RowTable
            rows={data.aggs.map((a) => ({
              key: a.city,
              cells: [a.city, a.avg_amount.toFixed(1), a.count],
              filtered: a.avg_amount <= 30,
              color: CITY_COLOR[a.city],
            }))}
            cols={['city', 'avg_amount', 'count']}
          />
        )}
        {step === 4 && (
          <RowTable
            rows={data.selectAggs.map((a) => ({ key: a.city, cells: [a.city, a.avg_amount.toFixed(1)], filtered: false, color: CITY_COLOR[a.city] }))}
            cols={['city', 'avg_amount']}
          />
        )}
        {step === 5 && (
          <RowTable
            rows={data.orderedAggs.map((a) => ({ key: a.city, cells: [a.city, a.avg_amount.toFixed(1)], filtered: false, color: CITY_COLOR[a.city] }))}
            cols={['city', 'avg_amount']}
          />
        )}
        {step === 6 && (
          <RowTable
            rows={data.orderedAggs.map((a, i) => ({
              key: a.city,
              cells: [a.city, a.avg_amount.toFixed(1)],
              filtered: i >= 2,
              color: CITY_COLOR[a.city],
            }))}
            cols={['city', 'avg_amount']}
          />
        )}
      </div>
    </VizPanel>
  )
}

interface DisplayRow {
  key: string | number
  cells: (string | number)[]
  /** filtered-out rows are shown struck-through / faded rather than removed, so the eye sees what got cut */
  filtered: boolean
  color: string
}

function RowTable({ rows, cols }: { rows: DisplayRow[]; cols: string[] }) {
  return (
    <table className="border-collapse text-left">
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c} className="border border-ink-700 px-2 py-1 font-mono text-[10px] text-ink-400">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} className="transition-all duration-300" style={{ opacity: r.filtered ? 0.3 : 1 }}>
            {r.cells.map((cell, i) => (
              <td
                key={i}
                className={`border border-ink-700 px-2 py-1 font-mono text-[11px] ${r.filtered ? 'text-bad line-through' : 'text-ink-100'}`}
                style={i === 1 || (cols[1] === 'city' && i === 0) ? { borderLeftColor: r.color, borderLeftWidth: 3 } : undefined}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
