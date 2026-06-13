import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { VizSlider } from '../components/VizSlider'
import { mulberry32, gaussian } from '../lib/random'

/** Same generator shape as ScalingLab — log-normal-ish car prices in [5k, 45k]. */
function genPrices(seed: number): number[] {
  const rng = mulberry32(seed)
  const prices: number[] = []
  for (let i = 0; i < 60; i++) {
    const g = gaussian(rng)
    const v = Math.exp(9.4 + 0.35 * g)
    prices.push(Math.min(45000, Math.max(5000, v)))
  }
  return prices
}

function histogram(xs: number[], bins: number, domain: [number, number]): number[] {
  const [lo, hi] = domain
  const width = (hi - lo) / bins
  const counts = new Array(bins).fill(0)
  for (const x of xs) {
    let idx = width === 0 ? 0 : Math.floor((x - lo) / width)
    idx = Math.min(bins - 1, Math.max(0, idx))
    counts[idx]++
  }
  return counts
}

const W = 480
const H = 220
const MARGIN = { top: 10, right: 10, bottom: 28, left: 10 }

export function BinningSlider() {
  const [bins, setBins] = useState(8)
  const prices = useMemo(() => genPrices(11), [])

  const domain = useMemo<[number, number]>(() => {
    const lo = Math.min(...prices)
    const hi = Math.max(...prices)
    return [lo, hi]
  }, [prices])

  const counts = useMemo(() => histogram(prices, bins, domain), [prices, bins, domain])
  const maxCount = Math.max(...counts)
  const binWidth = (domain[1] - domain[0]) / bins

  const xScale = useMemo(
    () => scaleLinear().domain(domain).range([MARGIN.left, W - MARGIN.right]),
    [domain],
  )
  const yScale = useMemo(
    () => scaleLinear().domain([0, maxCount]).range([H - MARGIN.bottom, MARGIN.top]),
    [maxCount],
  )

  const barWidth = (xScale(domain[1]) - xScale(domain[0])) / bins

  return (
    <VizPanel
      controls={
        <VizSlider label="number of bins" value={bins} min={3} max={20} step={1} onChange={setBins} />
      }
      readout={
        <>
          <span>bins: <span className="accent-text">{bins}</span></span>
          <span>bin width: <span className="accent-text">${binWidth.toFixed(0)}</span></span>
          <span>range: <span className="accent-text">${domain[0].toFixed(0)}–${domain[1].toFixed(0)}</span></span>
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Histogram of car prices with ${bins} bins`}>
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
            ${t.toFixed(0)}
          </text>
        ))}
      </svg>
    </VizPanel>
  )
}
