import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { VizSlider } from '../components/VizSlider'
import { separableBlobs } from '../data/mlDatasets'

const COLOR_0 = 'var(--color-m3)'
const COLOR_1 = 'var(--color-m4)'

const W = 480
const H = 360
const MARGIN = { top: 10, right: 10, bottom: 24, left: 24 }
const DOMAIN: [number, number] = [0, 10]

const DATA = separableBlobs(11, 40)
// labels as +1 / -1 for hinge loss
const SIGNED = DATA.map((p) => ({ x: p.x, y: p.y, sign: p.label === 1 ? 1 : -1 }))

const C_VALUES = [0.1, 0.3, 1, 3, 10, 30]

/** Sub-gradient descent on hinge loss for linear SVM: w·x + b, minimize 0.5||w||^2 + C * sum(hinge). */
function fitSvm(C: number): { w: [number, number]; b: number } {
  let w: [number, number] = [0.1, 0.1]
  let b = 0
  const lr = 0.01
  const iters = 400
  const n = SIGNED.length
  for (let t = 0; t < iters; t++) {
    let gw0 = w[0] // regularization gradient
    let gw1 = w[1]
    let gb = 0
    for (const p of SIGNED) {
      const margin = p.sign * (w[0] * p.x + w[1] * p.y + b)
      if (margin < 1) {
        gw0 -= (C * p.sign * p.x) / n
        gw1 -= (C * p.sign * p.y) / n
        gb -= (C * p.sign) / n
      }
    }
    w = [w[0] - lr * gw0, w[1] - lr * gw1]
    b = b - lr * gb
  }
  return { w, b }
}

const SOLUTIONS = C_VALUES.map((C) => ({ C, ...fitSvm(C) }))

export function SvmMargins() {
  const [cIndex, setCIndex] = useState(2) // C = 1 default

  const { w, b, C } = SOLUTIONS[cIndex]

  const xScale = useMemo(
    () => scaleLinear().domain(DOMAIN).range([MARGIN.left, W - MARGIN.right]),
    [],
  )
  const yScale = useMemo(
    () => scaleLinear().domain(DOMAIN).range([H - MARGIN.bottom, MARGIN.top]),
    [],
  )

  // decision line: w0*x + w1*y + b = 0  =>  y = (-b - w0*x) / w1
  // margin lines: w0*x + w1*y + b = +/-1
  const lineFor = (offset: number) => {
    if (Math.abs(w[1]) < 1e-9) return null
    const yAt = (x: number) => (-b - w[0] * x + offset) / w[1]
    return { x1: DOMAIN[0], y1: yAt(DOMAIN[0]), x2: DOMAIN[1], y2: yAt(DOMAIN[1]) }
  }

  const decisionLine = lineFor(0)
  const marginPlus = lineFor(1)
  const marginMinus = lineFor(-1)

  const wNorm = Math.hypot(w[0], w[1])
  const marginWidth = wNorm > 1e-9 ? 2 / wNorm : 0

  const { violations, supportVectors } = useMemo(() => {
    let violations = 0
    const sv: number[] = []
    SIGNED.forEach((p, i) => {
      const margin = p.sign * (w[0] * p.x + w[1] * p.y + b)
      if (margin < 1 - 1e-6) violations++
      if (margin <= 1 + 0.08) sv.push(i)
    })
    return { violations, supportVectors: sv }
  }, [w, b])

  return (
    <VizPanel
      controls={
        <VizSlider
          label="C (regularization)"
          value={cIndex}
          min={0}
          max={C_VALUES.length - 1}
          onChange={setCIndex}
          format={() => C_VALUES[cIndex].toString()}
        />
      }
      readout={
        <>
          <span>C = {C}</span>
          <span>margin width: {marginWidth.toFixed(2)}</span>
          <span>violations: {violations}</span>
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="SVM decision boundary with margin band and support vectors">
        {/* margin band */}
        {marginPlus && marginMinus && (
          <polygon
            points={`${xScale(marginPlus.x1)},${yScale(marginPlus.y1)} ${xScale(marginPlus.x2)},${yScale(marginPlus.y2)} ${xScale(marginMinus.x2)},${yScale(marginMinus.y2)} ${xScale(marginMinus.x1)},${yScale(marginMinus.y1)}`}
            fill="var(--accent)"
            opacity={0.06}
            className="transition-all duration-300"
          />
        )}
        {marginPlus && (
          <line
            x1={xScale(marginPlus.x1)}
            y1={yScale(marginPlus.y1)}
            x2={xScale(marginPlus.x2)}
            y2={yScale(marginPlus.y2)}
            stroke="var(--color-ink-400)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            className="transition-all duration-300"
          />
        )}
        {marginMinus && (
          <line
            x1={xScale(marginMinus.x1)}
            y1={yScale(marginMinus.y1)}
            x2={xScale(marginMinus.x2)}
            y2={yScale(marginMinus.y2)}
            stroke="var(--color-ink-400)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            className="transition-all duration-300"
          />
        )}
        {decisionLine && (
          <line
            x1={xScale(decisionLine.x1)}
            y1={yScale(decisionLine.y1)}
            x2={xScale(decisionLine.x2)}
            y2={yScale(decisionLine.y2)}
            stroke="var(--accent)"
            strokeWidth={2.5}
            className="transition-all duration-300"
          />
        )}
        {/* support vector rings */}
        {supportVectors.map((i) => (
          <circle
            key={`sv-${i}`}
            cx={xScale(DATA[i].x)}
            cy={yScale(DATA[i].y)}
            r={9}
            fill="none"
            stroke="var(--color-warn)"
            strokeWidth={2}
            className="transition-all duration-300"
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
            opacity={0.9}
          />
        ))}
      </svg>
    </VizPanel>
  )
}
