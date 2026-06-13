import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { SegmentedControl } from '../components/VizSlider'
import { Formula } from '../components/Formula'
import { mean, std } from '../lib/stats'
import { mulberry32, gaussian } from '../lib/random'

type Method = 'raw' | 'simple' | 'minmax' | 'zscore'

const METHOD_OPTIONS: { value: Method; label: string }[] = [
  { value: 'raw', label: 'raw' },
  { value: 'simple', label: 'x / max' },
  { value: 'minmax', label: 'min-max' },
  { value: 'zscore', label: 'z-score' },
]

/** Generate ~60 log-normal-ish car prices in [5k, 45k]. */
function genPrices(seed: number): number[] {
  const rng = mulberry32(seed)
  const prices: number[] = []
  for (let i = 0; i < 60; i++) {
    const g = gaussian(rng)
    // log-normal: center around ln(12000), spread tuned for ~5k-45k range
    const v = Math.exp(9.4 + 0.35 * g)
    prices.push(Math.min(45000, Math.max(5000, v)))
  }
  return prices
}

function transform(xs: number[], method: Method): number[] {
  if (method === 'raw') return xs
  if (method === 'simple') {
    const max = Math.max(...xs)
    return xs.map((x) => x / max)
  }
  if (method === 'minmax') {
    const min = Math.min(...xs)
    const max = Math.max(...xs)
    return xs.map((x) => (x - min) / (max - min))
  }
  // zscore
  const m = mean(xs)
  const s = std(xs)
  return xs.map((x) => (x - m) / s)
}

const BINS = 12

function histogram(xs: number[], domain: [number, number]): number[] {
  const [lo, hi] = domain
  const width = (hi - lo) / BINS
  const counts = new Array(BINS).fill(0)
  for (const x of xs) {
    let idx = width === 0 ? 0 : Math.floor((x - lo) / width)
    idx = Math.min(BINS - 1, Math.max(0, idx))
    counts[idx]++
  }
  return counts
}

const W = 480
const H = 220
const MARGIN = { top: 10, right: 10, bottom: 28, left: 10 }

export function ScalingLab() {
  const [method, setMethod] = useState<Method>('raw')
  const [seed, setSeed] = useState(7)

  const raw = useMemo(() => genPrices(seed), [seed])
  const values = useMemo(() => transform(raw, method), [raw, method])

  const domain = useMemo<[number, number]>(() => {
    const lo = Math.min(...values)
    const hi = Math.max(...values)
    // pad a touch so bars don't touch the edge
    const pad = (hi - lo) * 0.02 || 0.01
    return [lo - pad, hi + pad]
  }, [values])

  const counts = useMemo(() => histogram(values, domain), [values, domain])
  const maxCount = Math.max(...counts)

  const xScale = useMemo(
    () => scaleLinear().domain(domain).range([MARGIN.left, W - MARGIN.right]),
    [domain],
  )
  const yScale = useMemo(
    () => scaleLinear().domain([0, maxCount]).range([H - MARGIN.bottom, MARGIN.top]),
    [maxCount],
  )

  const stats = useMemo(
    () => ({
      min: Math.min(...values),
      max: Math.max(...values),
      mean: mean(values),
      std: std(values),
    }),
    [values],
  )

  const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(3))

  const barWidth = (xScale(domain[1]) - xScale(domain[0])) / BINS

  return (
    <VizPanel
      controls={
        <>
          <SegmentedControl label="scaling" value={method} onChange={setMethod} options={METHOD_OPTIONS} />
          <button
            onClick={() => setSeed((s) => s + 1)}
            className="rounded-md border border-ink-700 px-3 py-1.5 font-mono text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
          >
            ↻ resample prices
          </button>
        </>
      }
      readout={
        <>
          <span>min: <span className="accent-text">{fmt(stats.min)}</span></span>
          <span>max: <span className="accent-text">{fmt(stats.max)}</span></span>
          <span>mean: <span className="accent-text">{fmt(stats.mean)}</span></span>
          <span>std: <span className="accent-text">{fmt(stats.std)}</span></span>
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Histogram of car prices, ${method} scaling`}>
        {/* baseline */}
        <line x1={MARGIN.left} y1={H - MARGIN.bottom} x2={W - MARGIN.right} y2={H - MARGIN.bottom} stroke="var(--color-ink-700)" strokeWidth={1} />
        {counts.map((c, i) => {
          const x0 = xScale(domain[0]) + i * barWidth
          const y = yScale(c)
          const h = H - MARGIN.bottom - y
          return (
            <rect
              key={i}
              x={x0 + 1}
              y={y}
              width={Math.max(0, barWidth - 2)}
              height={Math.max(0, h)}
              fill="var(--accent)"
              opacity={0.75}
              className="transition-all duration-300"
            />
          )
        })}
        {/* axis ticks */}
        {[domain[0], (domain[0] + domain[1]) / 2, domain[1]].map((t, i) => (
          <text
            key={i}
            x={xScale(t)}
            y={H - 8}
            textAnchor="middle"
            fontSize={10}
            fontFamily="var(--font-mono)"
            fill="var(--color-ink-400)"
          >
            {fmt(t)}
          </text>
        ))}
      </svg>
      {method === 'minmax' && <Formula tex="x' = \dfrac{x - \min(x)}{\max(x) - \min(x)}" />}
      {method === 'zscore' && <Formula tex="z = \dfrac{x - \mu}{\sigma}" />}
    </VizPanel>
  )
}
