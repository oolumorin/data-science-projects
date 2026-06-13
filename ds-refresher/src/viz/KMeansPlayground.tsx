import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { VizSlider } from '../components/VizSlider'
import { StepPlayer } from '../components/StepPlayer'
import { threeBlobs, type Point } from '../data/mlDatasets'
import { mulberry32, gaussian } from '../lib/random'
import { euclidean } from '../lib/stats'

const W = 400
const H = 320
const MARGIN = { top: 10, right: 10, bottom: 24, left: 24 }
const DOMAIN: [number, number] = [0, 10]

const EW = 280
const EH = 200
const EMARGIN = { top: 16, right: 12, bottom: 28, left: 32 }

const DATA = threeBlobs(7, 20)

const PALETTE = ['var(--color-m3)', 'var(--color-m4)', 'var(--color-m8)', 'var(--color-m6)', 'var(--color-m7)', 'var(--color-m5)', 'var(--color-m2)', 'var(--color-warn)']

interface KMeansStep {
  centroids: Point[]
  assignments: number[]
  inertia: number
  kind: 'assign' | 'update'
}

function initCentroids(k: number, seed: number): Point[] {
  const rng = mulberry32(seed)
  const centroids: Point[] = []
  for (let i = 0; i < k; i++) {
    centroids.push({
      x: Math.min(10, Math.max(0, 5 + gaussian(rng) * 2.5)),
      y: Math.min(10, Math.max(0, 5 + gaussian(rng) * 2.5)),
    })
  }
  return centroids
}

function assign(centroids: Point[], points: Point[]): number[] {
  return points.map((p) => {
    let best = 0
    let bestD = Infinity
    centroids.forEach((c, i) => {
      const d = euclidean([p.x, p.y], [c.x, c.y])
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    return best
  })
}

function update(assignments: number[], points: Point[], k: number, prev: Point[]): Point[] {
  return Array.from({ length: k }, (_, i) => {
    const members = points.filter((_, idx) => assignments[idx] === i)
    if (members.length === 0) return prev[i]
    return {
      x: members.reduce((s, p) => s + p.x, 0) / members.length,
      y: members.reduce((s, p) => s + p.y, 0) / members.length,
    }
  })
}

function computeInertia(centroids: Point[], assignments: number[], points: Point[]): number {
  return points.reduce((s, p, i) => s + euclidean([p.x, p.y], [centroids[assignments[i]].x, centroids[assignments[i]].y]) ** 2, 0)
}

/** Run full k-means, recording each assign/update step, capped at maxIters. */
function runKMeans(k: number, seed: number, maxIters = 20): KMeansStep[] {
  const steps: KMeansStep[] = []
  let centroids = initCentroids(k, seed)
  let assignments = assign(centroids, DATA)
  steps.push({ centroids, assignments, inertia: computeInertia(centroids, assignments, DATA), kind: 'assign' })

  for (let iter = 0; iter < maxIters; iter++) {
    const newCentroids = update(assignments, DATA, k, centroids)
    steps.push({ centroids: newCentroids, assignments, inertia: computeInertia(newCentroids, assignments, DATA), kind: 'update' })
    const newAssignments = assign(newCentroids, DATA)
    const inertia = computeInertia(newCentroids, newAssignments, DATA)
    steps.push({ centroids: newCentroids, assignments: newAssignments, inertia, kind: 'assign' })

    const converged = JSON.stringify(newAssignments) === JSON.stringify(assignments)
    centroids = newCentroids
    assignments = newAssignments
    if (converged) break
  }
  return steps
}

function finalInertia(k: number, seed: number): number {
  const steps = runKMeans(k, seed)
  return steps[steps.length - 1].inertia
}

export function KMeansPlayground() {
  const [k, setK] = useState(3)
  const [seed, setSeed] = useState(1)
  const [step, setStep] = useState(0)

  const steps = useMemo(() => runKMeans(k, seed), [k, seed])
  const clampedStep = Math.min(step, steps.length - 1)
  const current = steps[clampedStep]

  const elbow = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({ k: i + 1, inertia: finalInertia(i + 1, seed) }))
  }, [seed])

  const xScale = useMemo(() => scaleLinear().domain(DOMAIN).range([MARGIN.left, W - MARGIN.right]), [])
  const yScale = useMemo(() => scaleLinear().domain(DOMAIN).range([H - MARGIN.bottom, MARGIN.top]), [])

  const exScale = useMemo(() => scaleLinear().domain([1, 8]).range([EMARGIN.left, EW - EMARGIN.right]), [])
  const maxInertia = Math.max(...elbow.map((e) => e.inertia))
  const eyScale = useMemo(() => scaleLinear().domain([0, maxInertia * 1.05]).range([EH - EMARGIN.bottom, EMARGIN.top]), [maxInertia])

  return (
    <VizPanel
      controls={
        <>
          <VizSlider label="k (clusters)" value={k} min={1} max={8} onChange={(v) => { setK(v); setStep(0) }} />
          <StepPlayer totalSteps={steps.length} step={clampedStep} onStepChange={setStep} stepLabel={current.kind === 'assign' ? 'assign' : 'update centroids'} />
          <button
            onClick={() => { setSeed((s) => s + 1); setStep(0) }}
            className="rounded-md border border-ink-700 px-3 py-1.5 font-mono text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
          >
            ↻ new random init
          </button>
        </>
      }
      readout={
        <>
          <span>step {clampedStep + 1}/{steps.length}: {current.kind}</span>
          <span>inertia: {current.inertia.toFixed(2)}</span>
          <span>converged in {Math.ceil((steps.length - 1) / 2)} iterations</span>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_280px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="K-means scatter with centroids">
          {DATA.map((p, i) => (
            <circle
              key={i}
              cx={xScale(p.x)}
              cy={yScale(p.y)}
              r={4.5}
              fill={PALETTE[current.assignments[i] % PALETTE.length]}
              opacity={0.85}
              className="transition-all duration-300"
            />
          ))}
          {current.centroids.map((c, i) => (
            <g key={i} className="transition-all duration-300" style={{ transform: `translate(${xScale(c.x)}px, ${yScale(c.y)}px)` }}>
              <circle r={9} fill={PALETTE[i % PALETTE.length]} stroke="var(--color-ink-100)" strokeWidth={2} />
              <line x1={-6} y1={0} x2={6} y2={0} stroke="var(--color-ink-950)" strokeWidth={2} />
              <line x1={0} y1={-6} x2={0} y2={6} stroke="var(--color-ink-950)" strokeWidth={2} />
            </g>
          ))}
        </svg>

        <svg viewBox={`0 0 ${EW} ${EH}`} className="w-full" role="img" aria-label="Elbow chart of inertia vs k">
          <line x1={EMARGIN.left} y1={EH - EMARGIN.bottom} x2={EW - EMARGIN.right} y2={EH - EMARGIN.bottom} stroke="var(--color-ink-700)" />
          <line x1={EMARGIN.left} y1={EMARGIN.top} x2={EMARGIN.left} y2={EH - EMARGIN.bottom} stroke="var(--color-ink-700)" />
          <path
            d={elbow.map((e, i) => `${i === 0 ? 'M' : 'L'} ${exScale(e.k)} ${eyScale(e.inertia)}`).join(' ')}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
          />
          {elbow.map((e) => (
            <circle
              key={e.k}
              cx={exScale(e.k)}
              cy={eyScale(e.inertia)}
              r={e.k === 3 ? 5 : 3.5}
              fill={e.k === k ? 'var(--color-warn)' : 'var(--accent)'}
              stroke={e.k === 3 ? 'var(--color-warn)' : 'none'}
              strokeWidth={2}
            />
          ))}
          {elbow.map((e) => (
            <text key={`label-${e.k}`} x={exScale(e.k)} y={EH - EMARGIN.bottom + 14} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
              {e.k}
            </text>
          ))}
          <text x={EMARGIN.left - 6} y={eyScale(maxInertia) + 3} textAnchor="end" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
            {maxInertia.toFixed(0)}
          </text>
          <text x={EMARGIN.left - 6} y={EH - EMARGIN.bottom + 3} textAnchor="end" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
            0
          </text>
          <text x={EW / 2} y={EH - 4} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
            k
          </text>
        </svg>
      </div>
    </VizPanel>
  )
}
