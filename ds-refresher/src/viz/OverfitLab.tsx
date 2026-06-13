import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { line as d3line, curveCatmullRom } from 'd3-shape'
import { VizPanel } from '../components/ConceptCard'
import { VizSlider, SegmentedControl } from '../components/VizSlider'
import { mse, polyfit, polyval } from '../lib/stats'
import { generateData, MAX_DEGREE, type DataPoint } from './regressionData'

const W = 460
const H = 260
const PAD = { top: 10, right: 14, bottom: 28, left: 34 }

const ERR_W = 460
const ERR_H = 170
const ERR_PAD = { top: 10, right: 14, bottom: 28, left: 40 }

const RES_W = 460
const RES_H = 130
const RES_PAD = { top: 10, right: 14, bottom: 24, left: 34 }

function zoneLabel(degree: number): { label: string; color: string } {
  if (degree <= 2) return { label: 'underfit zone', color: 'var(--color-warn)' }
  if (degree >= 9) return { label: 'overfit zone', color: 'var(--color-bad)' }
  return { label: 'sweet-spot zone', color: 'var(--color-good)' }
}

export function OverfitLab() {
  const [seed, setSeed] = useState(2)
  const [degree, setDegree] = useState(3)
  const [showTest, setShowTest] = useState<'both' | 'train' | 'test'>('both')

  const data = useMemo(() => generateData(seed), [seed])
  const train = useMemo(() => data.filter((d) => d.isTrain), [data])
  const test = useMemo(() => data.filter((d) => !d.isTrain), [data])

  // y-range across the data, with margin, used to clip curve blow-ups
  const yDomain = useMemo(() => {
    const ys = data.map((d) => d.y)
    const lo = Math.min(...ys)
    const hi = Math.max(...ys)
    const pad = (hi - lo) * 0.25 || 0.5
    return [lo - pad, hi + pad] as [number, number]
  }, [data])

  const xScale = useMemo(() => scaleLinear().domain([0, 1]).range([PAD.left, W - PAD.right]), [])
  const yScale = useMemo(
    () => scaleLinear().domain(yDomain).range([H - PAD.bottom, PAD.top]),
    [yDomain],
  )

  // coefficients for current degree, fit on TRAIN points only
  const coefs = useMemo(
    () => polyfit(train.map((d) => d.x), train.map((d) => d.y), degree),
    [train, degree],
  )

  // precompute train/test MSE for every degree 1..MAX_DEGREE (for the error-curve view)
  const errorCurve = useMemo(() => {
    const out: { degree: number; trainErr: number; testErr: number }[] = []
    for (let deg = 1; deg <= MAX_DEGREE; deg++) {
      const c = polyfit(train.map((d) => d.x), train.map((d) => d.y), deg)
      const trainErr = mse(train.map((d) => d.y), train.map((d) => polyval(c, d.x)))
      const testErr = mse(test.map((d) => d.y), test.map((d) => polyval(c, d.x)))
      out.push({ degree: deg, trainErr, testErr })
    }
    return out
  }, [train, test])

  const currentErr = errorCurve[degree - 1]

  // fitted curve, sampled densely, clipped to the y-domain so high-degree blow-ups
  // don't destroy the plot
  const curvePoints = useMemo(() => {
    const pts: [number, number][] = []
    const STEPS = 120
    for (let i = 0; i <= STEPS; i++) {
      const x = i / STEPS
      let y = polyval(coefs, x)
      y = Math.max(yDomain[0], Math.min(yDomain[1], y))
      pts.push([x, y])
    }
    return pts
  }, [coefs, yDomain])

  const lineGen = useMemo(
    () =>
      d3line<[number, number]>()
        .x((d) => xScale(d[0]))
        .y((d) => yScale(d[1]))
        .curve(curveCatmullRom),
    [xScale, yScale],
  )

  const curvePath = lineGen(curvePoints) ?? ''

  // residuals for current degree, for all points
  const residuals = useMemo(
    () => data.map((d) => ({ ...d, resid: d.y - polyval(coefs, d.x) })),
    [data, coefs],
  )

  const resYMax = useMemo(() => {
    const maxAbs = Math.max(...residuals.map((r) => Math.abs(r.resid)), 0.05)
    return maxAbs * 1.15
  }, [residuals])

  const resXScale = useMemo(
    () => scaleLinear().domain([0, 1]).range([RES_PAD.left, RES_W - RES_PAD.right]),
    [],
  )
  const resYScale = useMemo(
    () => scaleLinear().domain([-resYMax, resYMax]).range([RES_H - RES_PAD.bottom, RES_PAD.top]),
    [resYMax],
  )

  // error-curve scales
  const errXScale = useMemo(
    () => scaleLinear().domain([1, MAX_DEGREE]).range([ERR_PAD.left, ERR_W - ERR_PAD.right]),
    [],
  )
  const errYMax = useMemo(
    () => Math.max(...errorCurve.map((e) => Math.max(e.trainErr, e.testErr))) * 1.1,
    [errorCurve],
  )
  const errYScale = useMemo(
    () => scaleLinear().domain([0, errYMax]).range([ERR_H - ERR_PAD.bottom, ERR_PAD.top]),
    [errYMax],
  )

  const trainErrPath = useMemo(
    () =>
      d3line<{ degree: number; trainErr: number }>()
        .x((d) => errXScale(d.degree))
        .y((d) => errYScale(d.trainErr))(errorCurve) ?? '',
    [errorCurve, errXScale, errYScale],
  )
  const testErrPath = useMemo(
    () =>
      d3line<{ degree: number; testErr: number }>()
        .x((d) => errXScale(d.degree))
        .y((d) => errYScale(d.testErr))(errorCurve) ?? '',
    [errorCurve, errXScale, errYScale],
  )

  const zone = zoneLabel(degree)

  return (
    <VizPanel
      controls={
        <>
          <VizSlider
            label="polynomial degree"
            value={degree}
            min={1}
            max={MAX_DEGREE}
            step={1}
            onChange={setDegree}
            format={(v) => String(v)}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl
              label="show"
              value={showTest}
              onChange={setShowTest}
              options={[
                { value: 'both', label: 'train + test' },
                { value: 'train', label: 'train only' },
                { value: 'test', label: 'test only' },
              ]}
            />
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="rounded-md border border-ink-700 px-3 py-1.5 font-mono text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
            >
              ↻ resample noise
            </button>
          </div>
        </>
      }
      readout={
        <>
          <span>
            degree <span className="accent-text">{degree}</span> ·{' '}
            <span style={{ color: zone.color }}>{zone.label}</span>
          </span>
          <span>
            train MSE <span className="text-ink-100">{currentErr.trainErr.toFixed(4)}</span>
          </span>
          <span>
            test MSE <span className="text-ink-100">{currentErr.testErr.toFixed(4)}</span>
          </span>
          <span>
            n = {train.length} train / {test.length} test
          </span>
        </>
      }
    >
      {/* (a) fitted curve over the data */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Polynomial fit over noisy data points">
        {/* gridlines */}
        {yScale.ticks(4).map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={yScale(t)} y2={yScale(t)} stroke="var(--color-ink-800)" strokeWidth={1} />
            <text x={PAD.left - 6} y={yScale(t)} textAnchor="end" dominantBaseline="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        {xScale.ticks(5).map((t) => (
          <g key={t}>
            <line x1={xScale(t)} x2={xScale(t)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--color-ink-800)" strokeWidth={1} />
            <text x={xScale(t)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
              {t.toFixed(1)}
            </text>
          </g>
        ))}

        {/* fitted curve */}
        <path d={curvePath} fill="none" stroke="var(--accent)" strokeWidth={2.5} className="transition-all duration-300" />

        {/* data points */}
        {data.map((d, i) => {
          const dim = (showTest === 'train' && !d.isTrain) || (showTest === 'test' && d.isTrain)
          return (
            <circle
              key={i}
              cx={xScale(d.x)}
              cy={yScale(d.y)}
              r={d.isTrain ? 3.5 : 4.5}
              fill={d.isTrain ? 'var(--color-ink-100)' : 'none'}
              stroke={d.isTrain ? 'none' : 'var(--color-m6)'}
              strokeWidth={d.isTrain ? 0 : 2}
              opacity={dim ? 0.12 : d.isTrain ? 0.85 : 1}
              className="transition-all duration-300"
            />
          )
        })}

        <text x={W - PAD.right} y={H - 4} textAnchor="end" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
          x
        </text>
        <text x={6} y={PAD.top + 8} fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
          y
        </text>
        <g transform={`translate(${W - 150}, ${PAD.top + 6})`}>
          <circle cx={0} cy={0} r={3.5} fill="var(--color-ink-100)" />
          <text x={8} y={3.5} fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-300)">
            train
          </text>
          <circle cx={50} cy={0} r={4} fill="none" stroke="var(--color-m6)" strokeWidth={2} />
          <text x={59} y={3.5} fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-300)">
            test (hollow)
          </text>
        </g>
      </svg>

      {/* (b) train vs test error curves by degree */}
      <div className="mt-4">
        <p className="mb-1 font-mono text-[11px] text-ink-400">error vs polynomial degree</p>
        <svg viewBox={`0 0 ${ERR_W} ${ERR_H}`} className="w-full" role="img" aria-label="Train and test error as a function of polynomial degree">
          {/* zone shading */}
          <rect x={errXScale(1)} y={ERR_PAD.top} width={errXScale(2.5) - errXScale(1)} height={ERR_H - ERR_PAD.top - ERR_PAD.bottom} fill="var(--color-warn)" opacity={0.06} />
          <rect x={errXScale(8.5)} y={ERR_PAD.top} width={errXScale(MAX_DEGREE) - errXScale(8.5)} height={ERR_H - ERR_PAD.top - ERR_PAD.bottom} fill="var(--color-bad)" opacity={0.06} />

          {errYScale.ticks(4).map((t) => (
            <g key={t}>
              <line x1={ERR_PAD.left} x2={ERR_W - ERR_PAD.right} y1={errYScale(t)} y2={errYScale(t)} stroke="var(--color-ink-800)" strokeWidth={1} />
              <text x={ERR_PAD.left - 6} y={errYScale(t)} textAnchor="end" dominantBaseline="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
                {t.toFixed(3)}
              </text>
            </g>
          ))}
          {errXScale.ticks(MAX_DEGREE).map((t) => (
            <text key={t} x={errXScale(t)} y={ERR_H - ERR_PAD.bottom + 14} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
              {t}
            </text>
          ))}

          <path d={trainErrPath} fill="none" stroke="var(--color-good)" strokeWidth={2} />
          <path d={testErrPath} fill="none" stroke="var(--color-bad)" strokeWidth={2} />

          {/* current degree marker */}
          <line x1={errXScale(degree)} x2={errXScale(degree)} y1={ERR_PAD.top} y2={ERR_H - ERR_PAD.bottom} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 3" />

          <g transform={`translate(${ERR_PAD.left + 4}, ${ERR_PAD.top + 2})`}>
            <line x1={0} x2={14} y1={0} y2={0} stroke="var(--color-good)" strokeWidth={2} />
            <text x={18} y={3} fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-300)">train error</text>
            <line x1={90} x2={104} y1={0} y2={0} stroke="var(--color-bad)" strokeWidth={2} />
            <text x={108} y={3} fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-300)">test error</text>
          </g>

          <text x={ERR_W / 2} y={ERR_H - 2} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
            degree →
          </text>
        </svg>
        <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-400">
          <span style={{ color: 'var(--color-warn)' }}>underfit</span>
          <span style={{ color: 'var(--color-good)' }}>sweet spot</span>
          <span style={{ color: 'var(--color-bad)' }}>overfit</span>
        </div>
      </div>

      {/* (c) residual plot */}
      <div className="mt-4">
        <p className="mb-1 font-mono text-[11px] text-ink-400">residuals (y − ŷ) vs x</p>
        <svg viewBox={`0 0 ${RES_W} ${RES_H}`} className="w-full" role="img" aria-label="Residual plot">
          <line x1={RES_PAD.left} x2={RES_W - RES_PAD.right} y1={resYScale(0)} y2={resYScale(0)} stroke="var(--color-ink-600)" strokeWidth={1.5} />
          {resYScale.ticks(3).map((t) => (
            <text key={t} x={RES_PAD.left - 6} y={resYScale(t)} textAnchor="end" dominantBaseline="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
              {t.toFixed(2)}
            </text>
          ))}
          {residuals.map((r, i) => {
            const dim = (showTest === 'train' && !r.isTrain) || (showTest === 'test' && r.isTrain)
            return (
              <circle
                key={i}
                cx={resXScale(r.x)}
                cy={resYScale(r.resid)}
                r={r.isTrain ? 3.5 : 4.5}
                fill={r.isTrain ? 'var(--accent)' : 'none'}
                stroke={r.isTrain ? 'none' : 'var(--color-m6)'}
                strokeWidth={r.isTrain ? 0 : 2}
                opacity={dim ? 0.12 : 0.85}
                className="transition-all duration-300"
              />
            )
          })}
          <text x={RES_W / 2} y={RES_H - 2} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
            x →
          </text>
        </svg>
      </div>
    </VizPanel>
  )
}

export type { DataPoint }
