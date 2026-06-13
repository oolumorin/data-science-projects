import { useMemo } from 'react'
import { scaleLinear, scaleBand } from 'd3-scale'
import { line as d3line } from 'd3-shape'
import { VizPanel } from '../components/ConceptCard'
import { mean, std } from '../lib/stats'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May']
const SALES = [42, 58, 51, 73, 68]

const W = 200
const H = 140
const PAD = { top: 14, right: 10, bottom: 24, left: 30 }

interface Verdict {
  badge: '✓' | '⚠' | '✗'
  text: string
}

function Card({ title, verdict, children }: { title: string; verdict: Verdict; children: React.ReactNode }) {
  const color =
    verdict.badge === '✓' ? 'var(--color-good)' : verdict.badge === '⚠' ? 'var(--color-warn)' : 'var(--color-bad)'
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-950 p-3">
      <p className="mb-1 text-xs font-semibold text-ink-300">{title}</p>
      {children}
      <p className="mt-2 text-xs leading-relaxed" style={{ color }}>
        {verdict.badge} {verdict.text}
      </p>
    </div>
  )
}

export function SameDataFiveCharts() {
  const xScale = useMemo(
    () => scaleBand().domain(MONTHS).range([PAD.left, W - PAD.right]).padding(0.3),
    [],
  )
  const yScale = useMemo(
    () => scaleLinear().domain([0, Math.max(...SALES) * 1.15]).range([H - PAD.bottom, PAD.top]),
    [],
  )

  const linePath = useMemo(
    () =>
      d3line<number>()
        .x((_, i) => (xScale(MONTHS[i]) ?? 0) + xScale.bandwidth() / 2)
        .y((d) => yScale(d))(SALES) ?? '',
    [xScale, yScale],
  )

  const m = mean(SALES)
  const s = std(SALES)
  const q1 = 51
  const median = 58
  const q3 = 68

  return (
    <VizPanel readout={<span>monthly sales (units), Jan–May: {SALES.join(', ')}</span>}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Line chart" verdict={{ badge: '✓', text: 'Effective — shows the trend over time clearly.' }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Line chart of monthly sales">
            {yScale.ticks(3).map((t) => (
              <line key={t} x1={PAD.left} x2={W - PAD.right} y1={yScale(t)} y2={yScale(t)} stroke="var(--color-ink-800)" strokeWidth={1} />
            ))}
            <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={2} />
            {SALES.map((v, i) => (
              <circle key={i} cx={(xScale(MONTHS[i]) ?? 0) + xScale.bandwidth() / 2} cy={yScale(v)} r={3} fill="var(--accent)" />
            ))}
            {MONTHS.map((mo) => (
              <text key={mo} x={(xScale(mo) ?? 0) + xScale.bandwidth() / 2} y={H - 6} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
                {mo}
              </text>
            ))}
          </svg>
        </Card>

        <Card title="Bar chart" verdict={{ badge: '✓', text: 'Effective — compares discrete monthly totals.' }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Bar chart of monthly sales">
            {yScale.ticks(3).map((t) => (
              <line key={t} x1={PAD.left} x2={W - PAD.right} y1={yScale(t)} y2={yScale(t)} stroke="var(--color-ink-800)" strokeWidth={1} />
            ))}
            {SALES.map((v, i) => {
              const x = xScale(MONTHS[i]) ?? 0
              const bw = xScale.bandwidth()
              return <rect key={i} x={x} y={yScale(v)} width={bw} height={H - PAD.bottom - yScale(v)} fill="var(--accent)" opacity={0.8} />
            })}
            {MONTHS.map((mo) => (
              <text key={mo} x={(xScale(mo) ?? 0) + xScale.bandwidth() / 2} y={H - 6} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
                {mo}
              </text>
            ))}
          </svg>
        </Card>

        <Card title="Box plot" verdict={{ badge: '✗', text: 'Wrong tool — collapses 5 monthly points into one summary, hiding the trend entirely.' }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Box plot of sales values">
            {yScale.ticks(3).map((t) => (
              <line key={t} x1={PAD.left} x2={W - PAD.right} y1={yScale(t)} y2={yScale(t)} stroke="var(--color-ink-800)" strokeWidth={1} />
            ))}
            <line x1={W / 2} x2={W / 2} y1={yScale(Math.min(...SALES))} y2={yScale(Math.max(...SALES))} stroke="var(--accent)" strokeWidth={1.5} />
            <rect x={W / 2 - 25} y={yScale(q3)} width={50} height={yScale(q1) - yScale(q3)} fill="none" stroke="var(--accent)" strokeWidth={2} />
            <line x1={W / 2 - 25} x2={W / 2 + 25} y1={yScale(median)} y2={yScale(median)} stroke="var(--accent)" strokeWidth={2} />
            <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
              all 5 months
            </text>
          </svg>
        </Card>

        <Card title="Scatter plot" verdict={{ badge: '⚠', text: 'Misleading — a scatter implies independent x/y observations, not an ordered time sequence.' }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Scatter plot of sales values">
            {yScale.ticks(3).map((t) => (
              <line key={t} x1={PAD.left} x2={W - PAD.right} y1={yScale(t)} y2={yScale(t)} stroke="var(--color-ink-800)" strokeWidth={1} />
            ))}
            {SALES.map((v, i) => (
              <circle key={i} cx={(xScale(MONTHS[i]) ?? 0) + xScale.bandwidth() / 2} cy={yScale(v)} r={4} fill="var(--accent)" opacity={0.8} />
            ))}
            {MONTHS.map((mo) => (
              <text key={mo} x={(xScale(mo) ?? 0) + xScale.bandwidth() / 2} y={H - 6} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
                {mo}
              </text>
            ))}
          </svg>
        </Card>

        <Card title="Pie chart" verdict={{ badge: '✗', text: 'Wrong tool — months are not "parts of a whole," and pies cannot show a trend over time.' }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Pie chart of sales share by month">
            {(() => {
              const total = SALES.reduce((a, b) => a + b, 0)
              const start = -Math.PI / 2
              const cx = W / 2
              const cy = H / 2 + 4
              const r = 42
              const colors = ['var(--accent)', 'var(--color-m5)', 'var(--color-m3)', 'var(--color-m4)', 'var(--color-m8)']
              // cumulative fraction up to (but not including) slice i (no mutation)
              const offsets = SALES.map(
                (_, i) => SALES.slice(0, i).reduce((a, b) => a + b, 0) / total,
              )
              return SALES.map((v, i) => {
                const frac = v / total
                const a0 = start + offsets[i] * Math.PI * 2
                const a1 = a0 + frac * Math.PI * 2
                const x0 = cx + r * Math.cos(a0)
                const y0 = cy + r * Math.sin(a0)
                const x1 = cx + r * Math.cos(a1)
                const y1 = cy + r * Math.sin(a1)
                const large = a1 - a0 > Math.PI ? 1 : 0
                return (
                  <path key={i} d={`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`} fill={colors[i]} opacity={0.85} stroke="var(--color-ink-950)" strokeWidth={1} />
                )
              })
            })()}
          </svg>
        </Card>

        <Card title="Summary stats" verdict={{ badge: '✓', text: 'Effective as a companion — numeric anchors for the charts above.' }}>
          <div className="flex h-[140px] flex-col items-center justify-center gap-1 font-mono text-sm text-ink-200">
            <p>mean = {m.toFixed(1)}</p>
            <p>std = {s.toFixed(1)}</p>
            <p>median = {median}</p>
            <p>
              range = [{Math.min(...SALES)}, {Math.max(...SALES)}]
            </p>
          </div>
        </Card>
      </div>
    </VizPanel>
  )
}
