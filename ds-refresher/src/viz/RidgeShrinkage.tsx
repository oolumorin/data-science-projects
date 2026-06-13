import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { line as d3line } from 'd3-shape'
import { VizPanel } from '../components/ConceptCard'
import { VizSlider } from '../components/VizSlider'
import { mse, polyfit, polyval } from '../lib/stats'
import { generateData } from './regressionData'

const DEGREE = 8
const N_COEF_SHOWN = 6 // show coefficients 0..5 (intercept + degrees 1-5)

const BAR_W = 460
const BAR_H = 160
const BAR_PAD = { top: 14, right: 14, bottom: 28, left: 36 }

const CURVE_W = 460
const CURVE_H = 160
const CURVE_PAD = { top: 14, right: 14, bottom: 28, left: 44 }

const ALPHA_STEPS = 25 // resolution of the alpha sweep for the test-error curve

export function RidgeShrinkage() {
  const [logAlpha, setLogAlpha] = useState(-3)

  const data = useMemo(() => generateData(2), [])
  const train = useMemo(() => data.filter((d) => d.isTrain), [data])
  const test = useMemo(() => data.filter((d) => !d.isTrain), [data])

  const alpha = 10 ** logAlpha

  const coefs = useMemo(
    () => polyfit(train.map((d) => d.x), train.map((d) => d.y), DEGREE, alpha),
    [train, alpha],
  )

  const testErr = useMemo(
    () => mse(test.map((d) => d.y), test.map((d) => polyval(coefs, d.x))),
    [test, coefs],
  )

  // sweep alpha across the slider range for the test-error-vs-alpha curve
  const sweep = useMemo(() => {
    const out: { logA: number; err: number }[] = []
    for (let i = 0; i <= ALPHA_STEPS; i++) {
      const la = -3 + (6 * i) / ALPHA_STEPS
      const a = 10 ** la
      const c = polyfit(train.map((d) => d.x), train.map((d) => d.y), DEGREE, a)
      const err = mse(test.map((d) => d.y), test.map((d) => polyval(c, d.x)))
      out.push({ logA: la, err })
    }
    return out
  }, [train, test])

  const bestIdx = useMemo(
    () => sweep.reduce((best, s, i) => (s.err < sweep[best].err ? i : best), 0),
    [sweep],
  )

  const coefMax = useMemo(() => {
    const noAlphaCoefs = polyfit(train.map((d) => d.x), train.map((d) => d.y), DEGREE, 0)
    return Math.max(...noAlphaCoefs.slice(0, N_COEF_SHOWN).map((c) => Math.abs(c)), 1) * 1.1
  }, [train])

  const barXScale = useMemo(
    () => scaleLinear().domain([0, N_COEF_SHOWN]).range([BAR_PAD.left, BAR_W - BAR_PAD.right]),
    [],
  )
  const barYScale = useMemo(
    () =>
      scaleLinear()
        .domain([-coefMax, coefMax])
        .range([BAR_H - BAR_PAD.bottom, BAR_PAD.top]),
    [coefMax],
  )
  const zeroY = barYScale(0)

  const curveXScale = useMemo(
    () => scaleLinear().domain([-3, 3]).range([CURVE_PAD.left, CURVE_W - CURVE_PAD.right]),
    [],
  )
  const errMax = useMemo(() => Math.max(...sweep.map((s) => s.err)) * 1.1, [sweep])
  const curveYScale = useMemo(
    () => scaleLinear().domain([0, errMax]).range([CURVE_H - CURVE_PAD.bottom, CURVE_PAD.top]),
    [errMax],
  )

  const curvePath = useMemo(
    () =>
      d3line<{ logA: number; err: number }>()
        .x((d) => curveXScale(d.logA))
        .y((d) => curveYScale(d.err))(sweep) ?? '',
    [sweep, curveXScale, curveYScale],
  )

  const barW = (BAR_W - BAR_PAD.left - BAR_PAD.right) / N_COEF_SHOWN - 12

  return (
    <VizPanel
      controls={
        <VizSlider
          label="alpha (log scale)"
          value={logAlpha}
          min={-3}
          max={3}
          step={0.1}
          onChange={setLogAlpha}
          format={(v) => `1e${v.toFixed(1)}`}
        />
      }
      readout={
        <>
          <span>
            α = <span className="accent-text">{alpha < 1 ? alpha.toExponential(1) : alpha.toFixed(1)}</span>
          </span>
          <span>
            test MSE = <span className="text-ink-100">{testErr.toFixed(4)}</span>
          </span>
          <span>
            best α ≈ 10^{sweep[bestIdx].logA.toFixed(1)} (test MSE {sweep[bestIdx].err.toFixed(4)})
          </span>
        </>
      }
    >
      {/* coefficient bars */}
      <p className="mb-1 font-mono text-[11px] text-ink-400">
        ridge coefficients (degree-{DEGREE} fit, terms w₀..w₅)
      </p>
      <svg viewBox={`0 0 ${BAR_W} ${BAR_H}`} className="w-full" role="img" aria-label="Ridge coefficient magnitudes shrinking toward zero as alpha increases">
        <line x1={BAR_PAD.left} x2={BAR_W - BAR_PAD.right} y1={zeroY} y2={zeroY} stroke="var(--color-ink-600)" strokeWidth={1.5} />
        {coefs.slice(0, N_COEF_SHOWN).map((c, i) => {
          const x = barXScale(i) + 6
          const y0 = barYScale(0)
          const y1 = barYScale(c)
          const h = Math.abs(y1 - y0)
          const y = c >= 0 ? y1 : y0
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                fill="var(--accent)"
                opacity={0.75}
                className="transition-all duration-200"
              />
              <text x={x + barW / 2} y={BAR_H - BAR_PAD.bottom + 14} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
                w{i}
              </text>
            </g>
          )
        })}
        {barYScale.ticks(3).map((t) => (
          <text key={t} x={BAR_PAD.left - 6} y={barYScale(t)} textAnchor="end" dominantBaseline="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
            {t.toFixed(0)}
          </text>
        ))}
      </svg>

      {/* test error vs alpha */}
      <div className="mt-4">
        <p className="mb-1 font-mono text-[11px] text-ink-400">test error vs α</p>
        <svg viewBox={`0 0 ${CURVE_W} ${CURVE_H}`} className="w-full" role="img" aria-label="Test error as a function of alpha">
          {curveYScale.ticks(3).map((t) => (
            <g key={t}>
              <line x1={CURVE_PAD.left} x2={CURVE_W - CURVE_PAD.right} y1={curveYScale(t)} y2={curveYScale(t)} stroke="var(--color-ink-800)" strokeWidth={1} />
              <text x={CURVE_PAD.left - 6} y={curveYScale(t)} textAnchor="end" dominantBaseline="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
                {t.toFixed(3)}
              </text>
            </g>
          ))}
          {curveXScale.ticks(7).map((t) => (
            <text key={t} x={curveXScale(t)} y={CURVE_H - CURVE_PAD.bottom + 14} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
              1e{t}
            </text>
          ))}
          <path d={curvePath} fill="none" stroke="var(--color-bad)" strokeWidth={2} />
          {/* best-alpha marker */}
          <circle cx={curveXScale(sweep[bestIdx].logA)} cy={curveYScale(sweep[bestIdx].err)} r={4} fill="var(--color-good)" />
          {/* current alpha marker */}
          <line x1={curveXScale(logAlpha)} x2={curveXScale(logAlpha)} y1={CURVE_PAD.top} y2={CURVE_H - CURVE_PAD.bottom} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={CURVE_W / 2} y={CURVE_H - 2} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
            α (log scale) →
          </text>
        </svg>
      </div>
    </VizPanel>
  )
}
