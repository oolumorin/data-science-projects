import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { VizSlider } from '../components/VizSlider'
import { Formula } from '../components/Formula'
import { mulberry32, gaussian } from '../lib/random'
import { pearson } from '../lib/stats'

const N = 80
const W = 380
const H = 320
const MARGIN = 24

function genLinear(r: number, seed: number): { x: number; y: number }[] {
  const rng = mulberry32(seed)
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < N; i++) {
    const x = gaussian(rng)
    const noise = gaussian(rng)
    const y = r * x + Math.sqrt(Math.max(0, 1 - r * r)) * noise
    pts.push({ x, y })
  }
  return pts
}

function genParabola(seed: number): { x: number; y: number }[] {
  const rng = mulberry32(seed)
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < N; i++) {
    const x = (rng() - 0.5) * 4 // roughly [-2, 2]
    const noise = gaussian(rng) * 0.15
    const y = x * x + noise
    pts.push({ x, y })
  }
  return pts
}

export function PearsonPlayground() {
  const [target, setTarget] = useState(0.7)
  const [seed, setSeed] = useState(3)
  const [trap, setTrap] = useState(false)

  const points = useMemo(() => (trap ? genParabola(seed) : genLinear(target, seed)), [trap, target, seed])

  const sampleR = useMemo(() => pearson(points.map((p) => p.x), points.map((p) => p.y)), [points])

  const xExtent = useMemo(() => {
    const xs = points.map((p) => p.x)
    const lo = Math.min(...xs)
    const hi = Math.max(...xs)
    const pad = (hi - lo) * 0.1 || 0.5
    return [lo - pad, hi + pad] as [number, number]
  }, [points])

  const yExtent = useMemo(() => {
    const ys = points.map((p) => p.y)
    const lo = Math.min(...ys)
    const hi = Math.max(...ys)
    const pad = (hi - lo) * 0.1 || 0.5
    return [lo - pad, hi + pad] as [number, number]
  }, [points])

  const xScale = useMemo(() => scaleLinear().domain(xExtent).range([MARGIN, W - MARGIN]), [xExtent])
  const yScale = useMemo(() => scaleLinear().domain(yExtent).range([H - MARGIN, MARGIN]), [yExtent])

  return (
    <VizPanel
      controls={
        <>
          <VizSlider
            label="target r"
            value={target}
            min={-1}
            max={1}
            step={0.05}
            onChange={setTarget}
            format={(v) => v.toFixed(2)}
            disabled={trap}
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="rounded-md border border-ink-700 px-3 py-1.5 font-mono text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
            >
              ↻ resample
            </button>
            <button
              onClick={() => setTrap((t) => !t)}
              aria-pressed={trap}
              className={`rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
                trap ? 'accent-border accent-text bg-ink-800' : 'border-ink-700 text-ink-300 hover:border-ink-600 hover:text-ink-100'
              }`}
            >
              {trap ? '✕ hide nonlinear trap' : 'show a nonlinear trap'}
            </button>
          </div>
        </>
      }
      readout={
        <>
          <span>sample r: <span className="accent-text">{sampleR.toFixed(2)}</span></span>
          {trap && <span className="text-warn">r ≈ 0, but y = x² — clearly NOT independent</span>}
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[420px]" role="img" aria-label="Scatter plot of points showing the correlation">
        <line x1={MARGIN} y1={H - MARGIN} x2={W - MARGIN} y2={H - MARGIN} stroke="var(--color-ink-700)" strokeWidth={1} />
        <line x1={MARGIN} y1={MARGIN} x2={MARGIN} y2={H - MARGIN} stroke="var(--color-ink-700)" strokeWidth={1} />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xScale(p.x)}
            cy={yScale(p.y)}
            r={3.5}
            fill="var(--accent)"
            opacity={0.7}
            className="transition-all duration-300"
          />
        ))}
      </svg>
      <p className="mt-2 text-xs leading-relaxed text-ink-400">
        r measures the strength of a <strong>linear</strong> relationship only. It says nothing about
        slope steepness, nonlinear patterns, or causation — the parabola above has r ≈ 0 despite a
        perfect (nonlinear) relationship.
      </p>
      <Formula tex="r = \dfrac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum (x_i-\bar{x})^2 \sum (y_i-\bar{y})^2}}" />
    </VizPanel>
  )
}
