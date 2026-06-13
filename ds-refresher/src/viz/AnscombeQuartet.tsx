import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { mean, variance, pearson, linreg } from '../lib/stats'

/** The four real Anscombe's Quartet datasets (1973), as raw x/y arrays. */
const ANSCOMBE_RAW: { x: number[]; y: number[] }[] = [
  {
    x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
    y: [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68],
  },
  {
    x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
    y: [9.14, 8.14, 8.74, 8.77, 9.26, 8.1, 6.13, 3.1, 9.13, 7.26, 4.74],
  },
  {
    x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
    y: [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73],
  },
  {
    x: [8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8],
    y: [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.5, 5.56, 7.91, 6.89],
  },
]

/** Convert to point arrays for the scatter components. */
const ANSCOMBE: { x: number; y: number }[][] = ANSCOMBE_RAW.map((d) =>
  d.x.map((x, i) => ({ x, y: d.y[i] })),
)

const W = 220
const H = 200
const MARGIN = 20

function Scatter({ data, slope, intercept, label }: { data: { x: number; y: number }[]; slope: number; intercept: number; label: string }) {
  const xExtent = useMemo<[number, number]>(() => [3, 20], [])
  const yExtent = useMemo<[number, number]>(() => [3, 13], [])
  const xScale = useMemo(() => scaleLinear().domain(xExtent).range([MARGIN, W - MARGIN]), [xExtent])
  const yScale = useMemo(() => scaleLinear().domain(yExtent).range([H - MARGIN, MARGIN]), [yExtent])

  const lineX1 = xExtent[0]
  const lineX2 = xExtent[1]

  return (
    <div className="rounded-lg border border-ink-800 bg-ink-950 p-2">
      <p className="mb-1 font-mono text-xs text-ink-400">{label}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Scatter plot for ${label}`}>
        <line x1={MARGIN} y1={H - MARGIN} x2={W - MARGIN} y2={H - MARGIN} stroke="var(--color-ink-700)" strokeWidth={1} />
        <line x1={MARGIN} y1={MARGIN} x2={MARGIN} y2={H - MARGIN} stroke="var(--color-ink-700)" strokeWidth={1} />
        <line
          x1={xScale(lineX1)}
          y1={yScale(intercept + slope * lineX1)}
          x2={xScale(lineX2)}
          y2={yScale(intercept + slope * lineX2)}
          stroke="var(--color-m5)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        {data.map((p, i) => (
          <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={3.5} fill="var(--accent)" opacity={0.85} />
        ))}
      </svg>
    </div>
  )
}

export function AnscombeQuartet() {
  const [revealed, setRevealed] = useState(1)

  // stats panel based on dataset I — they're (almost) identical across all four
  const stats = useMemo(() => {
    const d = ANSCOMBE_RAW[0]
    const { slope, intercept } = linreg(d.x, d.y)
    return {
      meanX: mean(d.x),
      meanY: mean(d.y),
      varX: variance(d.x),
      varY: variance(d.y),
      r: pearson(d.x, d.y),
      slope,
      intercept,
    }
  }, [])

  const reveal = () => setRevealed((r) => Math.min(4, r + 1))
  const restart = () => setRevealed(1)

  return (
    <VizPanel
      controls={
        <div className="flex flex-wrap gap-2">
          <button
            onClick={reveal}
            disabled={revealed >= 4}
            className="rounded-md border border-ink-700 px-3 py-1.5 font-mono text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100 disabled:opacity-40"
          >
            reveal next dataset →
          </button>
          <button
            onClick={restart}
            className="rounded-md border border-ink-700 px-3 py-1.5 font-mono text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
          >
            ↺ restart
          </button>
        </div>
      }
      readout={
        <>
          <span>mean x: <span className="accent-text">{stats.meanX.toFixed(2)}</span></span>
          <span>mean y: <span className="accent-text">{stats.meanY.toFixed(2)}</span></span>
          <span>var x: <span className="accent-text">{stats.varX.toFixed(2)}</span></span>
          <span>var y: <span className="accent-text">{stats.varY.toFixed(2)}</span></span>
          <span>r: <span className="accent-text">{stats.r.toFixed(2)}</span></span>
          <span>fit: <span className="accent-text">y = {stats.intercept.toFixed(2)} + {stats.slope.toFixed(2)}x</span></span>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {ANSCOMBE.map((d, i) =>
          i < revealed ? (
            <Scatter key={i} data={d} slope={stats.slope} intercept={stats.intercept} label={`dataset ${i + 1}`} />
          ) : (
            <div key={i} className="flex items-center justify-center rounded-lg border border-dashed border-ink-800 bg-ink-950 p-2 text-xs text-ink-600" style={{ height: H }}>
              hidden
            </div>
          ),
        )}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-400">
        All four datasets share the same mean, variance, correlation, and regression line — yet they
        look completely different. Summary statistics alone can hide a lot. Always plot it.
      </p>
    </VizPanel>
  )
}
