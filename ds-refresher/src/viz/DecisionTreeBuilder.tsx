import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { VizSlider } from '../components/VizSlider'
import { StepPlayer } from '../components/StepPlayer'
import { twoBlobs, type Point2 } from '../data/mlDatasets'

const W = 480
const H = 320
const TREE_W = 480
const TREE_H = 200
const MARGIN = { top: 10, right: 10, bottom: 24, left: 24 }
const DOMAIN: [number, number] = [0, 10]

const COLOR_0 = 'var(--color-m3)'
const COLOR_1 = 'var(--color-m4)'

const DATA = twoBlobs(42, 40)

interface TreeNode {
  id: number
  depth: number
  // bounding box this node covers
  x0: number
  x1: number
  y0: number
  y1: number
  points: Point2[]
  majority: 0 | 1
  // split, if this is an internal node
  split?: {
    axis: 'x' | 'y'
    value: number
    left: TreeNode
    right: TreeNode
  }
}

function gini(points: Point2[]): number {
  if (points.length === 0) return 0
  const p1 = points.filter((p) => p.label === 1).length / points.length
  return 1 - p1 * p1 - (1 - p1) * (1 - p1)
}

function majorityLabel(points: Point2[]): 0 | 1 {
  const c1 = points.filter((p) => p.label === 1).length
  return c1 * 2 > points.length ? 1 : 0
}


/** Find the best axis-aligned split (gini impurity) for a set of points. */
function bestSplit(
  points: Point2[],
): { axis: 'x' | 'y'; value: number; left: Point2[]; right: Point2[] } | null {
  if (points.length < 2) return null
  let best: { axis: 'x' | 'y'; value: number; left: Point2[]; right: Point2[]; score: number } | null =
    null
  const total = points.length
  for (const axis of ['x', 'y'] as const) {
    const sorted = [...points].sort((a, b) => a[axis] - b[axis])
    for (let i = 1; i < sorted.length; i++) {
      const v = (sorted[i - 1][axis] + sorted[i][axis]) / 2
      if (sorted[i - 1][axis] === sorted[i][axis]) continue
      const left = points.filter((p) => p[axis] <= v)
      const right = points.filter((p) => p[axis] > v)
      if (left.length === 0 || right.length === 0) continue
      const score = (left.length / total) * gini(left) + (right.length / total) * gini(right)
      if (!best || score < best.score) {
        best = { axis, value: v, left, right, score }
      }
    }
  }
  if (!best) return null
  return best
}

/** Build a greedy CART tree, max depth `maxDepth`, recording build order. */
function buildTree(
  points: Point2[],
  bounds: { x0: number; x1: number; y0: number; y1: number },
  depth: number,
  maxDepth: number,
  order: TreeNode[],
  counter: { n: number },
): TreeNode {
  const node: TreeNode = {
    id: counter.n++,
    depth,
    ...bounds,
    points,
    majority: majorityLabel(points),
  }
  order.push(node)

  if (depth >= maxDepth || gini(points) === 0 || points.length < 2) {
    return node
  }

  const split = bestSplit(points)
  if (!split) return node

  const leftBounds =
    split.axis === 'x' ? { ...bounds, x1: split.value } : { ...bounds, y1: split.value }
  const rightBounds =
    split.axis === 'x' ? { ...bounds, x0: split.value } : { ...bounds, y0: split.value }

  const left = buildTree(split.left, leftBounds, depth + 1, maxDepth, order, counter)
  const right = buildTree(split.right, rightBounds, depth + 1, maxDepth, order, counter)

  node.split = { axis: split.axis, value: split.value, left, right }
  return node
}

/** Flatten regions (leaf + internal at the current step) for rendering the partitioned plane. */
function leafRegions(root: TreeNode, visibleIds: Set<number>): TreeNode[] {
  const out: TreeNode[] = []
  function walk(node: TreeNode) {
    const splitVisible = node.split && visibleIds.has(node.split.left.id) && visibleIds.has(node.split.right.id)
    if (!splitVisible) {
      out.push(node)
      return
    }
    walk(node.split!.left)
    walk(node.split!.right)
  }
  walk(root)
  return out
}

export function DecisionTreeBuilder() {
  const [depth, setDepth] = useState(3)
  const [step, setStep] = useState(0)

  const { root, order } = useMemo(() => {
    const order: TreeNode[] = []
    const root = buildTree(
      DATA,
      { x0: DOMAIN[0], x1: DOMAIN[1], y0: DOMAIN[0], y1: DOMAIN[1] },
      0,
      depth,
      order,
      { n: 0 },
    )
    return { root, order }
  }, [depth])

  // each "step" reveals one more node from `order` (in build order = BFS-ish recursive order)
  const internalNodes = useMemo(() => order.filter((n) => n.split), [order])
  const totalSteps = Math.max(1, internalNodes.length + 1)
  const clampedStep = Math.min(step, totalSteps - 1)

  // ids of nodes "visible" (added) by the current step
  const visibleIds = useMemo(() => {
    const ids = new Set<number>([root.id])
    for (let i = 0; i < clampedStep; i++) {
      const n = internalNodes[i]
      ids.add(n.split!.left.id)
      ids.add(n.split!.right.id)
    }
    return ids
  }, [internalNodes, clampedStep, root])

  const currentNode = clampedStep > 0 ? internalNodes[clampedStep - 1] : root

  const regions = useMemo(() => leafRegions(root, visibleIds), [root, visibleIds])

  const xScale = useMemo(
    () => scaleLinear().domain(DOMAIN).range([MARGIN.left, W - MARGIN.right]),
    [],
  )
  const yScale = useMemo(
    () => scaleLinear().domain(DOMAIN).range([H - MARGIN.bottom, MARGIN.top]),
    [],
  )

  // split lines drawn so far
  const splitLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; highlight: boolean }[] = []
    for (let i = 0; i < clampedStep; i++) {
      const n = internalNodes[i]
      const { axis, value } = n.split!
      const highlight = i === clampedStep - 1
      if (axis === 'x') {
        lines.push({ x1: value, y1: n.y0, x2: value, y2: n.y1, highlight })
      } else {
        lines.push({ x1: n.x0, y1: value, x2: n.x1, y2: value, highlight })
      }
    }
    return lines
  }, [internalNodes, clampedStep])

  // tree diagram layout
  const treeLayout = useMemo(() => {
    const positions = new Map<number, { x: number; y: number }>()
    const levelCounts = new Map<number, number>()
    const levelIndex = new Map<number, number>()
    for (const n of order) {
      levelCounts.set(n.depth, (levelCounts.get(n.depth) ?? 0) + 1)
    }
    // recompute positions via in-order traversal for nicer layout
    let leafX = 0
    const leafSpacing = TREE_W / Math.max(1, leafCount(root))
    function assign(node: TreeNode): number {
      if (!node.split || !visibleIds.has(node.split.left.id) || !visibleIds.has(node.split.right.id)) {
        const x = (leafX + 0.5) * leafSpacing
        leafX++
        positions.set(node.id, { x, y: 30 + node.depth * 45 })
        return x
      }
      const lx = assign(node.split.left)
      const rx = assign(node.split.right)
      const x = (lx + rx) / 2
      positions.set(node.id, { x, y: 30 + node.depth * 45 })
      return x
    }
    function leafCount(node: TreeNode): number {
      if (!node.split || !visibleIds.has(node.split.left.id) || !visibleIds.has(node.split.right.id)) return 1
      return leafCount(node.split.left) + leafCount(node.split.right)
    }
    assign(root)
    void levelIndex
    return positions
  }, [root, order, visibleIds])

  const treeEdges = useMemo(() => {
    const edges: { x1: number; y1: number; x2: number; y2: number; highlight: boolean }[] = []
    function walk(node: TreeNode) {
      if (!node.split || !visibleIds.has(node.split.left.id) || !visibleIds.has(node.split.right.id)) return
      const p = treeLayout.get(node.id)!
      const l = treeLayout.get(node.split.left.id)!
      const r = treeLayout.get(node.split.right.id)!
      const highlight = node.id === currentNode.id
      edges.push({ x1: p.x, y1: p.y, x2: l.x, y2: l.y, highlight })
      edges.push({ x1: p.x, y1: p.y, x2: r.x, y2: r.y, highlight })
      walk(node.split.left)
      walk(node.split.right)
    }
    walk(root)
    return edges
  }, [root, treeLayout, visibleIds, currentNode])

  const treeNodes = useMemo(() => {
    const nodes: TreeNode[] = []
    function walk(node: TreeNode) {
      nodes.push(node)
      if (node.split && visibleIds.has(node.split.left.id) && visibleIds.has(node.split.right.id)) {
        walk(node.split.left)
        walk(node.split.right)
      }
    }
    walk(root)
    return nodes
  }, [root, visibleIds])

  return (
    <VizPanel
      controls={
        <>
          <VizSlider
            label="max depth"
            value={depth}
            min={1}
            max={4}
            onChange={(v) => {
              setDepth(v)
              setStep(0)
            }}
          />
          <StepPlayer
            totalSteps={totalSteps}
            step={clampedStep}
            onStepChange={setStep}
            stepLabel="split"
          />
        </>
      }
      readout={
        <>
          <span>
            step {clampedStep} of {internalNodes.length}: {clampedStep === 0 ? 'root (no splits yet)' : `split on ${internalNodes[clampedStep - 1].split!.axis}`}
          </span>
          {depth === 4 && (
            <span className="text-warn">
              depth 4: tiny sliver regions start chasing single points — overfitting
            </span>
          )}
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="2D plane partitioned by decision tree splits">
          {/* region tints */}
          {regions.map((r) => (
            <rect
              key={r.id}
              x={xScale(r.x0)}
              y={yScale(r.y1)}
              width={xScale(r.x1) - xScale(r.x0)}
              height={yScale(r.y0) - yScale(r.y1)}
              fill={r.majority === 0 ? COLOR_0 : COLOR_1}
              opacity={0.12}
              className="transition-all duration-300"
            />
          ))}
          {/* split lines */}
          {splitLines.map((l, i) => (
            <line
              key={i}
              x1={xScale(l.x1)}
              y1={yScale(l.y1)}
              x2={xScale(l.x2)}
              y2={yScale(l.y2)}
              stroke={l.highlight ? 'var(--accent)' : 'var(--color-ink-400)'}
              strokeWidth={l.highlight ? 2.5 : 1.5}
              className="transition-all duration-300"
            />
          ))}
          {/* data points */}
          {DATA.map((p, i) => (
            <circle
              key={i}
              cx={xScale(p.x)}
              cy={yScale(p.y)}
              r={4}
              fill={p.label === 0 ? COLOR_0 : COLOR_1}
              opacity={0.9}
            />
          ))}
        </svg>

        <svg viewBox={`0 0 ${TREE_W} ${TREE_H}`} className="w-full" role="img" aria-label="Decision tree diagram growing alongside splits">
          {treeEdges.map((e, i) => (
            <line
              key={i}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={e.highlight ? 'var(--accent)' : 'var(--color-ink-600)'}
              strokeWidth={e.highlight ? 2 : 1.5}
              className="transition-all duration-300"
            />
          ))}
          {treeNodes.map((n) => {
            const pos = treeLayout.get(n.id)
            if (!pos) return null
            const isLeaf = !n.split || !visibleIds.has(n.split.left.id) || !visibleIds.has(n.split.right.id)
            const isCurrent = n.id === currentNode.id
            return (
              <g key={n.id} className="transition-all duration-300">
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isCurrent ? 10 : 8}
                  fill={isLeaf ? (n.majority === 0 ? COLOR_0 : COLOR_1) : 'var(--color-ink-800)'}
                  stroke={isCurrent ? 'var(--accent)' : 'var(--color-ink-600)'}
                  strokeWidth={isCurrent ? 2.5 : 1}
                  opacity={isLeaf ? 0.85 : 1}
                />
                <text
                  x={pos.x}
                  y={pos.y - 13}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily="var(--font-mono)"
                  fill="var(--color-ink-300)"
                >
                  {n.split ? `${n.split.axis}≤${n.split.value.toFixed(1)}` : `n=${n.points.length}`}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </VizPanel>
  )
}
