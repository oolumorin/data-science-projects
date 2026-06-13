import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { mulberry32, gaussian } from '../lib/random'

const W = 480
const H = 180
const MARGIN = 30

/** ~40 seeded points clustered around 50, plus a few outliers. */
function genData(): number[] {
  const rng = mulberry32(99)
  const pts: number[] = []
  for (let i = 0; i < 36; i++) pts.push(50 + gaussian(rng) * 8)
  pts.push(5, 12, 92, 98)
  return pts
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  }
  return sorted[base]
}

type PartId = 'median' | 'box' | 'whiskers' | 'outliers'

const LABELS: Record<PartId, string> = {
  median: 'Median — the middle value when sorted. Half the data falls above, half below.',
  box: 'Box (IQR) — spans Q1 to Q3, the middle 50% of the data.',
  whiskers: 'Whiskers — extend to the most extreme points within 1.5×IQR of the box edges.',
  outliers: 'Outliers — points beyond 1.5×IQR from Q1/Q3, flagged individually rather than hidden in a whisker.',
}

export function BoxplotAnatomy() {
  const data = useMemo(() => genData(), [])
  const [active, setActive] = useState<PartId | null>(null)

  const stats = useMemo(() => {
    const sorted = [...data].sort((a, b) => a - b)
    const q1 = quantile(sorted, 0.25)
    const median = quantile(sorted, 0.5)
    const q3 = quantile(sorted, 0.75)
    const iqr = q3 - q1
    const lowerFence = q1 - 1.5 * iqr
    const upperFence = q3 + 1.5 * iqr
    const inRange = sorted.filter((v) => v >= lowerFence && v <= upperFence)
    const whiskerLo = Math.min(...inRange)
    const whiskerHi = Math.max(...inRange)
    const outliers = sorted.filter((v) => v < lowerFence || v > upperFence)
    return { q1, median, q3, iqr, lowerFence, upperFence, whiskerLo, whiskerHi, outliers }
  }, [data])

  const domain = useMemo<[number, number]>(() => {
    const lo = Math.min(...data)
    const hi = Math.max(...data)
    const pad = (hi - lo) * 0.08
    return [lo - pad, hi + pad]
  }, [data])

  const xScale = useMemo(() => scaleLinear().domain(domain).range([MARGIN, W - MARGIN]), [domain])

  const boxY = 50
  const boxH = 36
  const dotY = 130

  const isOutlier = (v: number) => v < stats.lowerFence || v > stats.upperFence

  const partStyle = (part: PartId) => ({
    opacity: active === null || active === part ? 1 : 0.25,
    transition: 'opacity 200ms',
  })

  const handlers = (part: PartId) => ({
    tabIndex: 0,
    role: 'button' as const,
    'aria-label': LABELS[part],
    onMouseEnter: () => setActive(part),
    onMouseLeave: () => setActive(null),
    onFocus: () => setActive(part),
    onBlur: () => setActive(null),
    className: 'cursor-pointer outline-none',
  })

  return (
    <VizPanel readout={active && <span className="max-w-md leading-relaxed text-ink-300">{LABELS[active]}</span>}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Boxplot above a jittered dot strip">
        {/* whiskers */}
        <g {...handlers('whiskers')} style={partStyle('whiskers')}>
          <line x1={xScale(stats.whiskerLo)} y1={boxY + boxH / 2} x2={xScale(stats.q1)} y2={boxY + boxH / 2} stroke="var(--color-ink-300)" strokeWidth={1.5} />
          <line x1={xScale(stats.q3)} y1={boxY + boxH / 2} x2={xScale(stats.whiskerHi)} y2={boxY + boxH / 2} stroke="var(--color-ink-300)" strokeWidth={1.5} />
          <line x1={xScale(stats.whiskerLo)} y1={boxY + 8} x2={xScale(stats.whiskerLo)} y2={boxY + boxH - 8} stroke="var(--color-ink-300)" strokeWidth={1.5} />
          <line x1={xScale(stats.whiskerHi)} y1={boxY + 8} x2={xScale(stats.whiskerHi)} y2={boxY + boxH - 8} stroke="var(--color-ink-300)" strokeWidth={1.5} />
        </g>

        {/* box (IQR) */}
        <g {...handlers('box')} style={partStyle('box')}>
          <rect
            x={xScale(stats.q1)}
            y={boxY}
            width={xScale(stats.q3) - xScale(stats.q1)}
            height={boxH}
            fill="var(--accent)"
            opacity={0.18}
            stroke="var(--accent)"
            strokeWidth={1.5}
          />
        </g>

        {/* median line */}
        <g {...handlers('median')} style={partStyle('median')}>
          <line x1={xScale(stats.median)} y1={boxY} x2={xScale(stats.median)} y2={boxY + boxH} stroke="var(--accent)" strokeWidth={2.5} />
        </g>

        {/* outlier markers on boxplot row */}
        <g {...handlers('outliers')} style={partStyle('outliers')}>
          {stats.outliers.map((v, i) => (
            <circle key={i} cx={xScale(v)} cy={boxY + boxH / 2} r={3.5} fill="none" stroke="var(--color-bad)" strokeWidth={1.5} />
          ))}
        </g>

        {/* axis */}
        <line x1={MARGIN} y1={H - 14} x2={W - MARGIN} y2={H - 14} stroke="var(--color-ink-700)" strokeWidth={1} />

        {/* jittered dot strip */}
        {data.map((v, i) => {
          const outlier = isOutlier(v)
          const jitter = ((i * 37) % 20) - 10
          let dim = false
          if (active === 'box') dim = v < stats.q1 || v > stats.q3
          else if (active === 'median') dim = Math.abs(v - stats.median) > 0.6
          else if (active === 'whiskers') dim = outlier || (v >= stats.q1 && v <= stats.q3)
          else if (active === 'outliers') dim = !outlier
          return (
            <circle
              key={i}
              cx={xScale(v)}
              cy={dotY + jitter * 0.5}
              r={3}
              fill={outlier ? 'var(--color-bad)' : 'var(--accent)'}
              opacity={active === null ? 0.6 : dim ? 0.15 : 1}
              className="transition-opacity duration-200"
            />
          )
        })}
      </svg>
      <p className="mt-2 text-xs leading-relaxed text-ink-400">
        Hover or focus any part of the boxplot above — the median line, the IQR box, the whiskers, or
        the outlier markers — to see what it means and which underlying points it corresponds to.
      </p>
    </VizPanel>
  )
}
