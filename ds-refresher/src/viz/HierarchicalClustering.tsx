import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { VizSlider } from '../components/VizSlider'
import { StepPlayer } from '../components/StepPlayer'
import { smallPoints, type Point } from '../data/mlDatasets'
import { euclidean } from '../lib/stats'

const W = 320
const H = 320
const MARGIN = { top: 10, right: 10, bottom: 24, left: 24 }
const DOMAIN: [number, number] = [0, 10]

const DW = 380
const DH = 320
const DMARGIN = { top: 10, right: 10, bottom: 30, left: 36 }

const DATA = smallPoints(5, 12)

const PALETTE = ['var(--color-m3)', 'var(--color-m4)', 'var(--color-m8)', 'var(--color-m6)', 'var(--color-m7)', 'var(--color-m5)', 'var(--color-m2)', 'var(--color-warn)']

interface Cluster {
  id: number
  members: number[] // point indices
  height: number // merge height (0 for leaves)
  left?: Cluster
  right?: Cluster
}

interface MergeStep {
  clusters: Cluster[]
  merged?: { a: Cluster; b: Cluster; result: Cluster }
}

/** Single-linkage agglomerative clustering, recording every merge step. */
function agglomerate(points: Point[]): MergeStep[] {
  let clusters: Cluster[] = points.map((_, i) => ({ id: i, members: [i], height: 0 }))
  const steps: MergeStep[] = [{ clusters: clusters.slice() }]
  let nextId = points.length

  const dist = (a: Cluster, b: Cluster) => {
    let min = Infinity
    for (const i of a.members) {
      for (const j of b.members) {
        const d = euclidean([points[i].x, points[i].y], [points[j].x, points[j].y])
        if (d < min) min = d
      }
    }
    return min
  }

  while (clusters.length > 1) {
    let bestI = 0
    let bestJ = 1
    let bestD = Infinity
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = dist(clusters[i], clusters[j])
        if (d < bestD) {
          bestD = d
          bestI = i
          bestJ = j
        }
      }
    }
    const a = clusters[bestI]
    const b = clusters[bestJ]
    const result: Cluster = { id: nextId++, members: [...a.members, ...b.members], height: bestD, left: a, right: b }
    const newClusters = clusters.filter((_, idx) => idx !== bestI && idx !== bestJ)
    newClusters.push(result)
    clusters = newClusters
    steps.push({ clusters: clusters.slice(), merged: { a, b, result } })
  }
  return steps
}

const STEPS = agglomerate(DATA)
const FINAL_TREE = STEPS[STEPS.length - 1].clusters[0]

/** Assign a color index to each leaf based on cutting the final tree at `cutHeight`. */
function clustersAtCut(tree: Cluster, cutHeight: number): number[] {
  // walk tree, collecting subtrees whose height <= cutHeight at the root but split below
  const groups: Cluster[] = []
  function walk(node: Cluster) {
    if (node.height <= cutHeight || !node.left || !node.right) {
      groups.push(node)
      return
    }
    walk(node.left)
    walk(node.right)
  }
  walk(tree)
  const labels = new Array(DATA.length).fill(0)
  groups.forEach((g, gi) => {
    for (const m of g.members) labels[m] = gi
  })
  return labels
}

export function HierarchicalClustering() {
  const [step, setStep] = useState(0)
  const maxHeight = FINAL_TREE.height
  const [cut, setCut] = useState(maxHeight * 0.5)

  const clampedStep = Math.min(step, STEPS.length - 1)
  const current = STEPS[clampedStep]

  const xScale = useMemo(() => scaleLinear().domain(DOMAIN).range([MARGIN.left, W - MARGIN.right]), [])
  const yScale = useMemo(() => scaleLinear().domain(DOMAIN).range([H - MARGIN.bottom, MARGIN.top]), [])

  // color assignment based on current step's clusters
  const stepLabels = useMemo(() => {
    const labels = new Array(DATA.length).fill(-1)
    current.clusters.forEach((c, ci) => {
      for (const m of c.members) labels[m] = ci
    })
    return labels
  }, [current])

  const cutLabels = useMemo(() => clustersAtCut(FINAL_TREE, cut), [cut])
  const cutClusterCount = useMemo(() => new Set(cutLabels).size, [cutLabels])

  // dendrogram layout: x position per leaf, recursively computed for internal nodes
  const dendroLayout = useMemo(() => {
    const leafX = new Map<number, number>()
    const spacing = (DW - DMARGIN.left - DMARGIN.right) / (DATA.length - 1 || 1)
    DATA.forEach((_, i) => leafX.set(i, DMARGIN.left + i * spacing))

    const positions = new Map<number, { x: number; y: number }>()
    const hScale = scaleLinear().domain([0, maxHeight]).range([DH - DMARGIN.bottom, DMARGIN.top])

    function assign(node: Cluster): number {
      if (!node.left || !node.right) {
        const x = leafX.get(node.members[0])!
        positions.set(node.id, { x, y: hScale(0) })
        return x
      }
      const lx = assign(node.left)
      const rx = assign(node.right)
      const x = (lx + rx) / 2
      positions.set(node.id, { x, y: hScale(node.height) })
      return x
    }
    assign(FINAL_TREE)
    return { positions, hScale }
  }, [maxHeight])

  // dendrogram edges, dim if not yet merged at current step
  const dendroEdges = useMemo(() => {
    const mergedIds = new Set<number>()
    for (let i = 1; i <= clampedStep; i++) {
      mergedIds.add(STEPS[i].merged!.result.id)
    }
    const edges: { x1: number; y1: number; x2: number; y2: number; visible: boolean; highlight: boolean }[] = []
    function walk(node: Cluster) {
      if (!node.left || !node.right) return
      const p = dendroLayout.positions.get(node.id)!
      const l = dendroLayout.positions.get(node.left.id)!
      const r = dendroLayout.positions.get(node.right.id)!
      const visible = node.id < DATA.length ? true : mergedIds.has(node.id)
      const highlight = STEPS[clampedStep].merged?.result.id === node.id
      // vertical lines down to children, horizontal connector at parent height
      edges.push({ x1: l.x, y1: l.y, x2: l.x, y2: p.y, visible, highlight })
      edges.push({ x1: r.x, y1: r.y, x2: r.x, y2: p.y, visible, highlight })
      edges.push({ x1: l.x, y1: p.y, x2: r.x, y2: p.y, visible, highlight })
      walk(node.left)
      walk(node.right)
    }
    walk(FINAL_TREE)
    return edges
  }, [dendroLayout, clampedStep])

  return (
    <VizPanel
      controls={
        <>
          <StepPlayer totalSteps={STEPS.length} step={clampedStep} onStepChange={setStep} stepLabel="merge" />
          <VizSlider
            label="dendrogram cut height"
            value={cut}
            min={0}
            max={maxHeight}
            step={maxHeight / 100}
            onChange={setCut}
            format={(v) => v.toFixed(2)}
          />
        </>
      }
      readout={
        <>
          <span>merge step {clampedStep}/{STEPS.length - 1}</span>
          <span>clusters at cut: {cutClusterCount}</span>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Points agglomerating into clusters">
          {DATA.map((p, i) => (
            <circle
              key={i}
              cx={xScale(p.x)}
              cy={yScale(p.y)}
              r={6}
              fill={PALETTE[stepLabels[i] % PALETTE.length]}
              opacity={0.9}
              className="transition-all duration-300"
            />
          ))}
        </svg>

        <svg viewBox={`0 0 ${DW} ${DH}`} className="w-full" role="img" aria-label="Dendrogram with cut line">
          <line x1={DMARGIN.left} y1={DH - DMARGIN.bottom} x2={DW - DMARGIN.right} y2={DH - DMARGIN.bottom} stroke="var(--color-ink-700)" />
          <line x1={DMARGIN.left} y1={DMARGIN.top} x2={DMARGIN.left} y2={DH - DMARGIN.bottom} stroke="var(--color-ink-700)" />
          {dendroEdges.map((e, i) => (
            <line
              key={i}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={e.highlight ? 'var(--accent)' : 'var(--color-ink-400)'}
              strokeWidth={e.highlight ? 2.5 : 1.5}
              opacity={e.visible ? 1 : 0.15}
              className="transition-all duration-300"
            />
          ))}
          {DATA.map((_, i) => {
            const pos = dendroLayout.positions.get(i)!
            return (
              <circle key={i} cx={pos.x} cy={pos.y} r={3} fill={PALETTE[cutLabels[i] % PALETTE.length]} />
            )
          })}
          {/* cut line */}
          <line
            x1={DMARGIN.left}
            y1={dendroLayout.hScale(cut)}
            x2={DW - DMARGIN.right}
            y2={dendroLayout.hScale(cut)}
            stroke="var(--color-warn)"
            strokeWidth={2}
            strokeDasharray="5 4"
            className="transition-all duration-150"
          />
          <text x={DW - DMARGIN.right} y={dendroLayout.hScale(cut) - 6} textAnchor="end" fontSize={10} fontFamily="var(--font-mono)" fill="var(--color-warn)">
            cut = {cut.toFixed(2)}
          </text>
          {[0, maxHeight / 2, maxHeight].map((v) => (
            <text key={v} x={DMARGIN.left - 6} y={dendroLayout.hScale(v) + 3} textAnchor="end" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-400)">
              {v.toFixed(1)}
            </text>
          ))}
        </svg>
      </div>
    </VizPanel>
  )
}
