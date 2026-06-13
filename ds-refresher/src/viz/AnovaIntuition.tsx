import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { mulberry32, gaussian } from '../lib/random'
import { mean, clamp } from '../lib/stats'

const GROUP_COLORS = ['var(--accent)', 'var(--color-m6)', 'var(--color-m7)']
const N_PER_GROUP = 12
const SPREAD = 1.2 // fixed within-group std for the generated samples

const W = 480
const H = 260
const MARGIN = 30
const DOMAIN: [number, number] = [-2, 12]

/** Generate noise offsets per group, fixed for the session. */
function genOffsets(): number[][] {
  const rng = mulberry32(42)
  return Array.from({ length: 3 }, () => Array.from({ length: N_PER_GROUP }, () => gaussian(rng) * SPREAD))
}

const OFFSETS = genOffsets()

/** One-way ANOVA F-statistic from raw sample arrays. */
function fStatistic(groups: number[][]): { f: number; msBetween: number; msWithin: number } {
  const allValues = groups.flat()
  const grandMean = mean(allValues)
  const k = groups.length
  const N = allValues.length

  let ssBetween = 0
  let ssWithin = 0
  for (const g of groups) {
    const gMean = mean(g)
    ssBetween += g.length * (gMean - grandMean) ** 2
    ssWithin += g.reduce((s, v) => s + (v - gMean) ** 2, 0)
  }
  const dfBetween = k - 1
  const dfWithin = N - k
  const msBetween = ssBetween / dfBetween
  const msWithin = dfWithin === 0 ? 0 : ssWithin / dfWithin
  const f = msWithin === 0 ? Infinity : msBetween / msWithin
  return { f, msBetween, msWithin }
}

export function AnovaIntuition() {
  const [means, setMeans] = useState([3, 5, 7])
  const [focused, setFocused] = useState<number | null>(null)

  const groups = useMemo(
    () => means.map((m, gi) => OFFSETS[gi].map((o) => m + o)),
    [means],
  )

  const { f, msBetween, msWithin } = useMemo(() => fStatistic(groups), [groups])
  const verdict = f > 4 ? 'groups likely differ' : "can't distinguish from noise"

  const xScale = useMemo(() => scaleLinear().domain(DOMAIN).range([MARGIN, W - MARGIN]), [])

  const setMean = (i: number, v: number) => {
    setMeans((m) => {
      const next = [...m]
      next[i] = clamp(v, DOMAIN[0] + 1, DOMAIN[1] - 1)
      return next
    })
  }

  const rowH = 60
  const dotR = 4

  return (
    <VizPanel
      readout={
        <>
          <span>MS<sub>between</sub>: <span className="accent-text">{msBetween.toFixed(2)}</span></span>
          <span>MS<sub>within</sub>: <span className="accent-text">{msWithin.toFixed(2)}</span></span>
          <span>F: <span className="accent-text">{Number.isFinite(f) ? f.toFixed(2) : '∞'}</span></span>
          <span className={f > 4 ? 'text-good' : 'text-warn'}>{verdict}</span>
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Three group distributions with draggable means">
        <line x1={MARGIN} y1={H - 16} x2={W - MARGIN} y2={H - 16} stroke="var(--color-ink-700)" strokeWidth={1} />

        {/* grand mean reference line */}
        {(() => {
          const grand = mean(means)
          return (
            <line
              x1={xScale(grand)}
              y1={10}
              x2={xScale(grand)}
              y2={H - 16}
              stroke="var(--color-ink-600)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )
        })()}

        {groups.map((g, gi) => {
          const y0 = 20 + gi * rowH
          const m = means[gi]
          const color = GROUP_COLORS[gi]
          return (
            <g key={gi}>
              {/* normal-ish curve */}
              <path
                d={(() => {
                  const pts: string[] = []
                  for (let i = 0; i <= 40; i++) {
                    const xv = DOMAIN[0] + (i / 40) * (DOMAIN[1] - DOMAIN[0])
                    const z = (xv - m) / SPREAD
                    const density = Math.exp(-0.5 * z * z)
                    const y = y0 + rowH * 0.55 - density * (rowH * 0.5)
                    pts.push(`${i === 0 ? 'M' : 'L'} ${xScale(xv)} ${y}`)
                  }
                  return pts.join(' ')
                })()}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                opacity={0.6}
                className="transition-all duration-200"
              />
              {/* dot strip */}
              {g.map((v, i) => (
                <circle
                  key={i}
                  cx={xScale(v)}
                  cy={y0 + rowH * 0.55 + 8 + (i % 2) * 6}
                  r={dotR}
                  fill={color}
                  opacity={0.7}
                  className="transition-all duration-200"
                />
              ))}
              {/* draggable mean marker */}
              <g
                tabIndex={0}
                role="slider"
                aria-label={`Group ${gi + 1} mean`}
                aria-valuenow={Math.round(m * 10) / 10}
                aria-valuemin={DOMAIN[0] + 1}
                aria-valuemax={DOMAIN[1] - 1}
                className="cursor-grab outline-none"
                onPointerDown={(e) => {
                  const svg = (e.target as SVGElement).ownerSVGElement
                  if (!svg) return
                  const move = (ev: PointerEvent) => {
                    const rect = svg.getBoundingClientRect()
                    const px = ((ev.clientX - rect.left) / rect.width) * W
                    setMean(gi, xScale.invert(px))
                  }
                  const up = () => {
                    window.removeEventListener('pointermove', move)
                    window.removeEventListener('pointerup', up)
                  }
                  window.addEventListener('pointermove', move)
                  window.addEventListener('pointerup', up)
                }}
                onKeyDown={(e) => {
                  const step = e.shiftKey ? 1 : 0.25
                  if (e.key === 'ArrowRight') {
                    e.preventDefault()
                    setMean(gi, means[gi] + step)
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault()
                    setMean(gi, means[gi] - step)
                  }
                }}
                onFocus={() => setFocused(gi)}
                onBlur={() => setFocused(null)}
              >
                <line x1={xScale(m)} y1={y0} x2={xScale(m)} y2={y0 + rowH * 0.55} stroke={color} strokeWidth={2} />
                <circle
                  cx={xScale(m)}
                  cy={y0}
                  r={7}
                  fill={color}
                  stroke={focused === gi ? 'var(--color-ink-100)' : 'none'}
                  strokeWidth={2}
                />
                <text x={xScale(m)} y={y0 - 12} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill={color}>
                  μ{gi + 1}={m.toFixed(1)}
                </text>
              </g>
            </g>
          )
        })}
      </svg>
      <p className="mt-2 text-xs leading-relaxed text-ink-400">
        Drag (or focus + arrow keys) any group's mean marker. As the means spread apart relative to
        each group's spread, the between-group variance (MS<sub>between</sub>) grows relative to the
        within-group variance (MS<sub>within</sub>) — and F rises with it.
      </p>
    </VizPanel>
  )
}
