import { useMemo, useState, useCallback, useRef } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { linreg } from '../lib/stats'
import { mulberry32, gaussian } from '../lib/random'
import { clamp } from '../lib/stats'

const W = 460
const H = 280
const PAD = { top: 16, right: 16, bottom: 30, left: 36 }

const N = 12

function generatePoints(seed: number) {
  const rng = mulberry32(seed)
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) / N
    const y = 0.3 + 0.5 * x + gaussian(rng) * 0.12
    pts.push({ x, y })
  }
  return pts
}

const DOMAIN: [number, number] = [0, 1]

export function LeastSquares() {
  const points = useMemo(() => generatePoints(7), [])
  const best = useMemo(() => linreg(points.map((p) => p.x), points.map((p) => p.y)), [points])

  // line state: y at x=0 and y at x=1 (the two handles)
  const [y0, setY0] = useState(0.7)
  const [y1, setY1] = useState(0.3)
  const [animating, setAnimating] = useState(false)
  const dragRef = useRef<'y0' | 'y1' | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const yDomain = useMemo(() => {
    const ys = points.map((p) => p.y)
    return [Math.min(...ys, y0, y1) - 0.15, Math.max(...ys, y0, y1) + 0.15] as [number, number]
  }, [points, y0, y1])

  const xScale = useMemo(() => scaleLinear().domain(DOMAIN).range([PAD.left, W - PAD.right]), [])
  const yScale = useMemo(
    () => scaleLinear().domain(yDomain).range([H - PAD.bottom, PAD.top]),
    [yDomain],
  )

  const slope = y1 - y0
  const intercept = y0

  const predY = useCallback((x: number) => intercept + slope * x, [intercept, slope])

  const residuals = points.map((p) => ({ ...p, resid: p.y - predY(p.x) }))
  const totalArea = residuals.reduce((s, r) => s + r.resid ** 2, 0)

  const yToVal = useCallback(
    (clientY: number) => {
      const svg = svgRef.current
      if (!svg) return 0
      const rect = svg.getBoundingClientRect()
      const py = ((clientY - rect.top) / rect.height) * H
      const val = yScale.invert(py)
      return clamp(val, yDomain[0], yDomain[1])
    },
    [yScale, yDomain],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return
      const val = yToVal(e.clientY)
      if (dragRef.current === 'y0') setY0(val)
      else setY1(val)
    },
    [yToVal],
  )

  const startDrag = (which: 'y0' | 'y1') => (e: React.PointerEvent) => {
    dragRef.current = which
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const endDrag = () => {
    dragRef.current = null
  }

  const nudge = (which: 'y0' | 'y1', dir: number) => {
    const step = 0.02
    if (which === 'y0') setY0((v) => clamp(v + dir * step, yDomain[0], yDomain[1]))
    else setY1((v) => clamp(v + dir * step, yDomain[0], yDomain[1]))
  }

  const snapToBest = () => {
    setAnimating(true)
    setY0(best.intercept)
    setY1(best.intercept + best.slope)
    setTimeout(() => setAnimating(false), 320)
  }

  const isBest =
    Math.abs(intercept - best.intercept) < 0.001 && Math.abs(slope - best.slope) < 0.001

  return (
    <VizPanel
      controls={
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={snapToBest}
            className="rounded-md border border-ink-700 px-3 py-1.5 font-mono text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
          >
            snap to best fit (OLS)
          </button>
          <span className="font-mono text-xs text-ink-400">
            drag the two handles, or focus + ↑/↓ to nudge
          </span>
        </div>
      }
      readout={
        <>
          <span>
            slope <span className="accent-text">{slope.toFixed(3)}</span>
          </span>
          <span>
            intercept <span className="accent-text">{intercept.toFixed(3)}</span>
          </span>
          <span>
            Σ(residual²) ={' '}
            <span className={isBest ? 'text-good' : 'text-ink-100'}>{totalArea.toFixed(4)}</span>
          </span>
          {isBest && <span className="text-good">this is the OLS minimum ✓</span>}
        </>
      }
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label="Scatter plot with a draggable regression line and squared-residual areas"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {/* gridlines */}
        {yScale.ticks(4).map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={yScale(t)} y2={yScale(t)} stroke="var(--color-ink-800)" strokeWidth={1} />
            <text x={PAD.left - 6} y={yScale(t)} textAnchor="end" dominantBaseline="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
              {t.toFixed(2)}
            </text>
          </g>
        ))}
        {xScale.ticks(5).map((t) => (
          <text key={t} x={xScale(t)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
            {t.toFixed(1)}
          </text>
        ))}

        {/* squared-residual squares */}
        {residuals.map((r, i) => {
          const px = xScale(r.x)
          const py = yScale(r.y)
          const pyHat = yScale(predY(r.x))
          const sidePx = Math.abs(py - pyHat)
          // anchor the square so one corner sits on the point, extending toward the line
          const sign = r.resid >= 0 ? -1 : 1
          const rectY = sign === -1 ? py - sidePx : py
          const rectX = px
          return (
            <rect
              key={i}
              x={rectX}
              y={rectY}
              width={sidePx}
              height={sidePx}
              fill="var(--accent)"
              opacity={0.18}
              stroke="var(--accent)"
              strokeOpacity={0.35}
              className={animating ? 'transition-all duration-300' : ''}
            />
          )
        })}

        {/* regression line */}
        <line
          x1={xScale(0)}
          y1={yScale(y0)}
          x2={xScale(1)}
          y2={yScale(y1)}
          stroke="var(--accent)"
          strokeWidth={2.5}
          className={animating ? 'transition-all duration-300' : ''}
        />

        {/* data points */}
        {points.map((p, i) => (
          <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={4} fill="var(--color-ink-100)" />
        ))}

        {/* draggable handles */}
        {([
          { which: 'y0' as const, x: 0, y: y0 },
          { which: 'y1' as const, x: 1, y: y1 },
        ]).map((h) => (
          <circle
            key={h.which}
            cx={xScale(h.x)}
            cy={yScale(h.y)}
            r={7}
            fill="var(--color-ink-950)"
            stroke="var(--accent)"
            strokeWidth={2.5}
            className={`cursor-grab transition-all duration-150 ${animating ? 'duration-300' : ''}`}
            tabIndex={0}
            role="slider"
            aria-label={`Line handle at x=${h.x}`}
            aria-valuenow={Number(h.y.toFixed(2))}
            aria-valuemin={Number(yDomain[0].toFixed(2))}
            aria-valuemax={Number(yDomain[1].toFixed(2))}
            onPointerDown={startDrag(h.which)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                nudge(h.which, 1)
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                nudge(h.which, -1)
              }
            }}
          />
        ))}

        <text x={W / 2} y={H - 2} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
          x →
        </text>
      </svg>
    </VizPanel>
  )
}
