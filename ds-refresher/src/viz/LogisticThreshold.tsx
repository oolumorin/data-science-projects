import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { VizSlider } from '../components/VizSlider'
import { separableBlobs } from '../data/mlDatasets'
import { sigmoid } from '../lib/stats'

const COLOR_0 = 'var(--color-m3)'
const COLOR_1 = 'var(--color-m4)'

const DATA = separableBlobs(11, 40)

// Sigmoid curve view dimensions
const SW = 480
const SH = 220
const SMARGIN = { top: 10, right: 10, bottom: 28, left: 30 }

// Scatter view dimensions
const PW = 480
const PH = 320
const PMARGIN = { top: 10, right: 10, bottom: 24, left: 24 }
const DOMAIN: [number, number] = [0, 10]

/** A few gradient-descent steps on logistic regression for w = [w0, w1, w2] (z = w0 + w1*x + w2*y). */
function fitLogReg(): [number, number, number] {
  let w0 = 0
  let w1 = 0
  let w2 = 0
  const lr = 0.05
  const n = DATA.length
  for (let iter = 0; iter < 500; iter++) {
    let g0 = 0
    let g1 = 0
    let g2 = 0
    for (const p of DATA) {
      const z = w0 + w1 * p.x + w2 * p.y
      const pred = sigmoid(z)
      const err = pred - p.label
      g0 += err
      g1 += err * p.x
      g2 += err * p.y
    }
    w0 -= (lr * g0) / n
    w1 -= (lr * g1) / n
    w2 -= (lr * g2) / n
  }
  return [w0, w1, w2]
}

const WEIGHTS = fitLogReg()
const [w0, w1, w2] = WEIGHTS
const zRange: [number, number] = [-10, 10]

export function LogisticThreshold() {
  const [threshold, setThreshold] = useState(0.5)

  // for each point, compute z and probability
  const predictions = useMemo(() => {
    return DATA.map((p) => {
      const z = w0 + w1 * p.x + w2 * p.y
      const prob = sigmoid(z)
      const predicted: 0 | 1 = prob >= threshold ? 1 : 0
      return { ...p, z, prob, predicted }
    })
  }, [threshold])

  const { fp, fn, tp, tn } = useMemo(() => {
    let fp = 0
    let fn = 0
    let tp = 0
    let tn = 0
    for (const p of predictions) {
      if (p.label === 1 && p.predicted === 1) tp++
      else if (p.label === 0 && p.predicted === 0) tn++
      else if (p.label === 0 && p.predicted === 1) fp++
      else fn++
    }
    return { fp, fn, tp, tn }
  }, [predictions])

  // sigmoid curve scales
  const sxScale = useMemo(
    () => scaleLinear().domain(zRange).range([SMARGIN.left, SW - SMARGIN.right]),
    [],
  )
  const syScale = useMemo(
    () => scaleLinear().domain([0, 1]).range([SH - SMARGIN.bottom, SMARGIN.top]),
    [],
  )

  const curvePath = useMemo(() => {
    const pts: string[] = []
    for (let i = 0; i <= 100; i++) {
      const z = zRange[0] + (i / 100) * (zRange[1] - zRange[0])
      const y = sigmoid(z)
      pts.push(`${i === 0 ? 'M' : 'L'} ${sxScale(z)} ${syScale(y)}`)
    }
    return pts.join(' ')
  }, [sxScale, syScale])

  // scatter scales
  const pxScale = useMemo(
    () => scaleLinear().domain(DOMAIN).range([PMARGIN.left, PW - PMARGIN.right]),
    [],
  )
  const pyScale = useMemo(
    () => scaleLinear().domain(DOMAIN).range([PH - PMARGIN.bottom, PMARGIN.top]),
    [],
  )

  // decision boundary line: w0 + w1*x + w2*y = logit(threshold)
  // solve for y given x: y = (logit(threshold) - w0 - w1*x) / w2
  const logitThreshold = useMemo(() => {
    const t = Math.min(0.999, Math.max(0.001, threshold))
    return Math.log(t / (1 - t))
  }, [threshold])

  const boundaryLine = useMemo(() => {
    if (Math.abs(w2) < 1e-9) return null
    const yAt = (x: number) => (logitThreshold - w0 - w1 * x) / w2
    return { x1: DOMAIN[0], y1: yAt(DOMAIN[0]), x2: DOMAIN[1], y2: yAt(DOMAIN[1]) }
  }, [logitThreshold])

  return (
    <VizPanel
      controls={
        <VizSlider
          label="threshold"
          value={threshold}
          min={0.05}
          max={0.95}
          step={0.01}
          onChange={setThreshold}
          format={(v) => v.toFixed(2)}
        />
      }
      readout={
        <>
          <span>
            TP <span className="text-good">{tp}</span> · TN{' '}
            <span className="text-good">{tn}</span>
          </span>
          <span>
            FP <span className="text-bad">{fp}</span> · FN{' '}
            <span className="text-bad">{fn}</span>
          </span>
          <span>threshold: {threshold.toFixed(2)}</span>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full" role="img" aria-label="Sigmoid curve with draggable threshold">
          {/* axes */}
          <line x1={SMARGIN.left} y1={SH - SMARGIN.bottom} x2={SW - SMARGIN.right} y2={SH - SMARGIN.bottom} stroke="var(--color-ink-700)" />
          <line x1={SMARGIN.left} y1={SMARGIN.top} x2={SMARGIN.left} y2={SH - SMARGIN.bottom} stroke="var(--color-ink-700)" />
          {/* sigmoid curve */}
          <path d={curvePath} fill="none" stroke="var(--accent)" strokeWidth={2} />
          {/* threshold line */}
          <line
            x1={SMARGIN.left}
            y1={syScale(threshold)}
            x2={SW - SMARGIN.right}
            y2={syScale(threshold)}
            stroke="var(--color-warn)"
            strokeWidth={2}
            strokeDasharray="5 4"
            className="transition-all duration-150"
          />
          <text x={SW - SMARGIN.right - 4} y={syScale(threshold) - 6} textAnchor="end" fontSize={10} fontFamily="var(--font-mono)" fill="var(--color-warn)">
            threshold = {threshold.toFixed(2)}
          </text>
          {/* y axis labels */}
          {[0, 0.5, 1].map((v) => (
            <text key={v} x={SMARGIN.left - 6} y={syScale(v) + 3} textAnchor="end" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
              {v}
            </text>
          ))}
          <text x={SW / 2} y={SH - 6} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
            z = w₀ + w₁x + w₂y
          </text>
          <text x={4} y={12} fontSize={10} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
            σ(z)
          </text>
          {/* data points projected onto the sigmoid by their z */}
          {predictions.map((p, i) => (
            <circle
              key={i}
              cx={sxScale(Math.max(zRange[0], Math.min(zRange[1], p.z)))}
              cy={syScale(p.prob)}
              r={3.5}
              fill={p.label === 0 ? COLOR_0 : COLOR_1}
              opacity={0.85}
            />
          ))}
        </svg>

        <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full" role="img" aria-label="2D scatter with logistic decision boundary">
          {/* shaded background regions per predicted class would need grid; instead draw boundary line */}
          {boundaryLine && (
            <line
              x1={pxScale(boundaryLine.x1)}
              y1={pyScale(boundaryLine.y1)}
              x2={pxScale(boundaryLine.x2)}
              y2={pyScale(boundaryLine.y2)}
              stroke="var(--color-warn)"
              strokeWidth={2}
              strokeDasharray="5 4"
              className="transition-all duration-150"
            />
          )}
          {predictions.map((p, i) => {
            const correct = p.label === p.predicted
            return (
              <circle
                key={i}
                cx={pxScale(p.x)}
                cy={pyScale(p.y)}
                r={5}
                fill={p.label === 0 ? COLOR_0 : COLOR_1}
                stroke={correct ? 'none' : 'var(--color-bad)'}
                strokeWidth={correct ? 0 : 2}
                opacity={0.9}
                className="transition-all duration-150"
              />
            )
          })}
        </svg>
      </div>
    </VizPanel>
  )
}
