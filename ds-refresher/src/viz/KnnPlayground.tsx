import { useMemo, useRef, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { VizSlider } from '../components/VizSlider'
import { twoBlobs } from '../data/mlDatasets'
import { euclidean } from '../lib/stats'

const W = 480
const H = 360
const MARGIN = { top: 10, right: 10, bottom: 24, left: 24 }
const DOMAIN: [number, number] = [0, 10]

const COLOR_0 = 'var(--color-m3)' // blue
const COLOR_1 = 'var(--color-m4)' // orange

const GRID_COLS = 60
const GRID_ROWS = 45

const DATA = twoBlobs(42, 40)

export function KnnPlayground() {
  const [k, setK] = useState(5)
  const [query, setQuery] = useState<[number, number]>([5, 5])
  const [showBoundary, setShowBoundary] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const xScale = useMemo(
    () => scaleLinear().domain(DOMAIN).range([MARGIN.left, W - MARGIN.right]),
    [],
  )
  const yScale = useMemo(
    () => scaleLinear().domain(DOMAIN).range([H - MARGIN.bottom, MARGIN.top]),
    [],
  )

  // distances from query point to all data points, sorted
  const neighbors = useMemo(() => {
    return DATA.map((p, i) => ({
      i,
      p,
      d: euclidean([query[0], query[1]], [p.x, p.y]),
    })).sort((a, b) => a.d - b.d)
  }, [query])

  const kNearest = useMemo(() => neighbors.slice(0, k), [neighbors, k])

  const prediction = useMemo(() => {
    const votes0 = kNearest.filter((n) => n.p.label === 0).length
    const votes1 = k - votes0
    const winner: 0 | 1 = votes1 > votes0 ? 1 : 0
    return { votes0, votes1, winner }
  }, [kNearest, k])

  // classify an arbitrary point via the same kNN rule
  const classify = useMemo(() => {
    return (qx: number, qy: number): 0 | 1 => {
      const dists = DATA.map((p) => ({
        p,
        d: euclidean([qx, qy], [p.x, p.y]),
      })).sort((a, b) => a.d - b.d)
      let v0 = 0
      let v1 = 0
      for (let i = 0; i < k; i++) {
        if (dists[i].p.label === 0) v0++
        else v1++
      }
      return v1 > v0 ? 1 : 0
    }
  }, [k])

  // decision-boundary grid
  const grid = useMemo(() => {
    if (!showBoundary) return []
    const cells: { x: number; y: number; w: number; h: number; label: 0 | 1 }[] = []
    const cellW = (DOMAIN[1] - DOMAIN[0]) / GRID_COLS
    const cellH = (DOMAIN[1] - DOMAIN[0]) / GRID_ROWS
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cx = DOMAIN[0] + (c + 0.5) * cellW
        const cy = DOMAIN[0] + (r + 0.5) * cellH
        cells.push({ x: c * cellW, y: r * cellH, w: cellW, h: cellH, label: classify(cx, cy) })
      }
    }
    return cells
  }, [showBoundary, classify])

  const placeQuery = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const px = ((clientX - rect.left) / rect.width) * W
    const py = ((clientY - rect.top) / rect.height) * H
    const qx = xScale.invert(px)
    const qy = yScale.invert(py)
    setQuery([
      Math.min(DOMAIN[1], Math.max(DOMAIN[0], qx)),
      Math.min(DOMAIN[1], Math.max(DOMAIN[0], qy)),
    ])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = 0.25
    let [qx, qy] = query
    switch (e.key) {
      case 'ArrowLeft':
        qx -= step
        break
      case 'ArrowRight':
        qx += step
        break
      case 'ArrowUp':
        qy += step
        break
      case 'ArrowDown':
        qy -= step
        break
      default:
        return
    }
    e.preventDefault()
    setQuery([
      Math.min(DOMAIN[1], Math.max(DOMAIN[0], qx)),
      Math.min(DOMAIN[1], Math.max(DOMAIN[0], qy)),
    ])
  }

  const winnerColor = prediction.winner === 0 ? COLOR_0 : COLOR_1
  const winnerName = prediction.winner === 0 ? 'blue' : 'orange'
  const votesWinner = prediction.winner === 0 ? prediction.votes0 : prediction.votes1

  return (
    <VizPanel
      controls={
        <>
          <VizSlider label="k (neighbors)" value={k} min={1} max={15} onChange={setK} />
          <button
            onClick={() => setShowBoundary((b) => !b)}
            aria-pressed={showBoundary}
            className={`rounded-md border px-3 py-1 font-mono text-xs transition-colors ${
              showBoundary
                ? 'accent-border accent-text border bg-ink-800'
                : 'border-ink-700 text-ink-400 hover:border-ink-600 hover:text-ink-100'
            }`}
          >
            decision boundary: {showBoundary ? 'on' : 'off'}
          </button>
        </>
      }
      readout={
        <>
          <span>
            prediction:{' '}
            <span style={{ color: winnerColor }} className="font-semibold">
              {winnerName}
            </span>
          </span>
          <span>
            {votesWinner} of {k} neighbors are {winnerName} →{' '}
            <span style={{ color: winnerColor }}>{winnerName}</span>
          </span>
          <span>
            query: ({query[0].toFixed(1)}, {query[1].toFixed(1)})
          </span>
        </>
      }
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair touch-none"
        role="application"
        aria-label="KNN playground: click to place the query point, arrow keys move it when focused"
        tabIndex={0}
        onClick={(e) => placeQuery(e.clientX, e.clientY)}
        onKeyDown={handleKeyDown}
      >
        {/* decision boundary backdrop */}
        {grid.map((cell, i) => (
          <rect
            key={i}
            x={xScale(cell.x)}
            y={yScale(cell.y + cell.h)}
            width={xScale(cell.x + cell.w) - xScale(cell.x)}
            height={yScale(cell.y) - yScale(cell.y + cell.h)}
            fill={cell.label === 0 ? COLOR_0 : COLOR_1}
            opacity={0.1}
          />
        ))}

        {/* connecting lines to k nearest neighbors */}
        {kNearest.map((n) => (
          <line
            key={`line-${n.i}`}
            x1={xScale(query[0])}
            y1={yScale(query[1])}
            x2={xScale(n.p.x)}
            y2={yScale(n.p.y)}
            stroke="var(--color-ink-400)"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.6}
          />
        ))}

        {/* data points */}
        {DATA.map((p, i) => (
          <circle
            key={i}
            cx={xScale(p.x)}
            cy={yScale(p.y)}
            r={5}
            fill={p.label === 0 ? COLOR_0 : COLOR_1}
            stroke={kNearest.some((n) => n.i === i) ? 'var(--color-ink-100)' : 'none'}
            strokeWidth={2}
            opacity={0.9}
          />
        ))}

        {/* query point */}
        <circle
          cx={xScale(query[0])}
          cy={yScale(query[1])}
          r={7}
          fill={winnerColor}
          stroke="var(--color-ink-100)"
          strokeWidth={2}
          className="transition-all duration-150"
        />
        <text
          x={xScale(query[0])}
          y={yScale(query[1]) - 12}
          textAnchor="middle"
          fontSize={10}
          fontFamily="var(--font-mono)"
          fill="var(--color-ink-100)"
        >
          query
        </text>
      </svg>
    </VizPanel>
  )
}
