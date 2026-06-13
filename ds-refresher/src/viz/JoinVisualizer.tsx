import { useMemo, useState } from 'react'
import { VizPanel } from '../components/ConceptCard'
import { SegmentedControl } from '../components/VizSlider'

interface Customer {
  customer_id: number
  name: string
}

interface Order {
  order_id: number
  customer_id: number
  amount: number
}

const CUSTOMERS: Customer[] = [
  { customer_id: 1, name: 'Asha' },
  { customer_id: 2, name: 'Ben' },
  { customer_id: 3, name: 'Cy' },
]

const ORDERS: Order[] = [
  { order_id: 101, customer_id: 1, amount: 40 },
  { order_id: 102, customer_id: 1, amount: 15 },
  { order_id: 103, customer_id: 2, amount: 70 },
  { order_id: 104, customer_id: 4, amount: 25 }, // orphan order, no matching customer
]

type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL OUTER'

interface ResultRow {
  name: string | null
  customer_id: number | null
  order_id: number | null
  amount: number | null
}

function computeJoin(type: JoinType): ResultRow[] {
  const rows: ResultRow[] = []
  const matchedOrderIds = new Set<number>()

  for (const c of CUSTOMERS) {
    const orders = ORDERS.filter((o) => o.customer_id === c.customer_id)
    if (orders.length > 0) {
      for (const o of orders) {
        matchedOrderIds.add(o.order_id)
        rows.push({ name: c.name, customer_id: c.customer_id, order_id: o.order_id, amount: o.amount })
      }
    } else if (type === 'LEFT' || type === 'FULL OUTER') {
      rows.push({ name: c.name, customer_id: c.customer_id, order_id: null, amount: null })
    }
    // INNER/RIGHT with no orders: skip customer
  }

  if (type === 'RIGHT' || type === 'FULL OUTER') {
    for (const o of ORDERS) {
      if (!matchedOrderIds.has(o.order_id)) {
        rows.push({ name: null, customer_id: o.customer_id, order_id: o.order_id, amount: o.amount })
      }
    }
  }

  return rows
}

const JOIN_OPTIONS: { value: JoinType; label: string }[] = [
  { value: 'INNER', label: 'INNER' },
  { value: 'LEFT', label: 'LEFT' },
  { value: 'RIGHT', label: 'RIGHT' },
  { value: 'FULL OUTER', label: 'FULL OUTER' },
]

function Cell({ children, na }: { children: React.ReactNode; na?: boolean }) {
  return (
    <td className={`border border-ink-700 px-2 py-1 font-mono text-xs ${na ? 'text-ink-600 italic' : 'text-ink-100'}`}>
      {na ? 'NULL' : children}
    </td>
  )
}

/** Venn diagram with the regions relevant to the join type lit up. */
function VennDiagram({ type }: { type: JoinType }) {
  const leftLit = type === 'LEFT' || type === 'FULL OUTER' || type === 'INNER'
  const rightLit = type === 'RIGHT' || type === 'FULL OUTER' || type === 'INNER'
  const centerLit = true // every join type includes the intersection

  const onlyLeftLit = type === 'LEFT' || type === 'FULL OUTER'
  const onlyRightLit = type === 'RIGHT' || type === 'FULL OUTER'

  return (
    <svg viewBox="0 0 240 140" className="w-full max-w-[220px]" role="img" aria-label={`Venn diagram for ${type} JOIN`}>
      <circle
        cx={95}
        cy={70}
        r={55}
        fill={onlyLeftLit ? 'var(--accent)' : 'transparent'}
        opacity={onlyLeftLit ? 0.35 : 1}
        stroke="var(--accent)"
        strokeWidth={1.5}
        className="transition-all duration-300"
      />
      <circle
        cx={145}
        cy={70}
        r={55}
        fill={onlyRightLit ? 'var(--color-m5)' : 'transparent'}
        opacity={onlyRightLit ? 0.35 : 1}
        stroke="var(--color-m5)"
        strokeWidth={1.5}
        className="transition-all duration-300"
      />
      {/* intersection overlay */}
      <clipPath id="leftCircle">
        <circle cx={95} cy={70} r={55} />
      </clipPath>
      <circle
        cx={145}
        cy={70}
        r={55}
        fill={centerLit ? 'var(--color-good)' : 'transparent'}
        opacity={centerLit ? 0.45 : 0}
        clipPath="url(#leftCircle)"
        className="transition-all duration-300"
      />
      <text x={70} y={70} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="var(--color-ink-300)">
        customers
      </text>
      <text x={170} y={70} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="var(--color-ink-300)">
        orders
      </text>
      <text x={120} y={130} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
        {leftLit && rightLit && !onlyLeftLit && !onlyRightLit
          ? 'matched rows only'
          : onlyLeftLit && onlyRightLit
            ? 'all rows, matched + unmatched'
            : onlyLeftLit
              ? 'all customers + matches'
              : onlyRightLit
                ? 'all orders + matches'
                : ''}
      </text>
    </svg>
  )
}

export function JoinVisualizer() {
  const [type, setType] = useState<JoinType>('INNER')
  const [hoverId, setHoverId] = useState<number | null>(null)

  const result = useMemo(() => computeJoin(type), [type])

  return (
    <VizPanel
      controls={<SegmentedControl label="JOIN type" value={type} onChange={setType} options={JOIN_OPTIONS} />}
      readout={
        <span>
          result rows: <span className="accent-text">{result.length}</span>
        </span>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <p className="mb-1 font-mono text-xs text-ink-400">customers</p>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">customer_id</th>
                <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">name</th>
              </tr>
            </thead>
            <tbody>
              {CUSTOMERS.map((c) => (
                <tr key={c.customer_id} onMouseEnter={() => setHoverId(c.customer_id)} onMouseLeave={() => setHoverId(null)}>
                  <td
                    className={`border border-ink-700 px-2 py-1 font-mono text-xs text-ink-100 transition-colors duration-300 ${
                      hoverId === c.customer_id ? 'bg-ink-700/60' : ''
                    }`}
                  >
                    {c.customer_id}
                  </td>
                  <td className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-100">{c.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="mb-1 font-mono text-xs text-ink-400">orders</p>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">order_id</th>
                <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">customer_id</th>
                <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">amount</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((o) => {
                const orphan = !CUSTOMERS.some((c) => c.customer_id === o.customer_id)
                return (
                  <tr key={o.order_id}>
                    <td className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-100">{o.order_id}</td>
                    <td
                      className={`border border-ink-700 px-2 py-1 font-mono text-xs transition-colors duration-300 ${
                        orphan ? 'text-bad' : 'text-ink-100'
                      } ${hoverId === o.customer_id ? 'bg-ink-700/60' : ''}`}
                      onMouseEnter={() => setHoverId(o.customer_id)}
                      onMouseLeave={() => setHoverId(null)}
                    >
                      {o.customer_id}
                    </td>
                    <td className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-100">{o.amount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center">
          <VennDiagram type={type} />
        </div>
      </div>

      <p className="mt-4 mb-1 font-mono text-xs text-ink-400">
        result — SELECT * FROM customers {type} JOIN orders ON customers.customer_id = orders.customer_id
      </p>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">name</th>
            <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">customer_id</th>
            <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">order_id</th>
            <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">amount</th>
          </tr>
        </thead>
        <tbody>
          {result.length === 0 && (
            <tr>
              <td colSpan={4} className="border border-ink-700 px-2 py-1 text-center font-mono text-xs text-ink-600 italic">
                (empty)
              </td>
            </tr>
          )}
          {result.map((r, i) => (
            <tr key={i}>
              <Cell na={r.name === null}>{r.name}</Cell>
              <Cell na={r.customer_id === null}>{r.customer_id}</Cell>
              <Cell na={r.order_id === null}>{r.order_id}</Cell>
              <Cell na={r.amount === null}>{r.amount}</Cell>
            </tr>
          ))}
        </tbody>
      </table>
    </VizPanel>
  )
}
