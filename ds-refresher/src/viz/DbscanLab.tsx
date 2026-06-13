import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { VizPanel } from '../components/ConceptCard'
import { VizSlider, SegmentedControl } from '../components/VizSlider'
import { dbscanBlobs, moons, type Point } from '../data/mlDatasets'
import { euclidean } from '../lib/stats'

const W = 480
const H = 360
const MARGIN = { top: 10, right: 10, bottom: 24, left: 24 }
const DOMAIN: [number, number] = [0, 10]

const PALETTE = ['var(--color-m3)', 'var(--color-m4)', 'var(--color-m8)', 'var(--color-m6)', 'var(--color-m7)', 'var(--color-m5)', 'var(--color-m2)']

type Dataset = 'blobs' | 'moons'
type PointType = 'core' | 'border' | 'noise'

const BLOBS = dbscanBlobs(9, 20)
const MOONS = moons(3, 35)

interface DbscanResult {
  labels: number[] // cluster id, -1 = noise
  types: PointType[]
}

function dbscan(points: Point[], eps: number, minPts: number): DbscanResult {
  const n = points.length
  const neighbors: number[][] = points.map((p, i) =>
    points.reduce<number[]>((acc, q, j) => {
      if (i !== j && euclidean([p.x, p.y], [q.x, q.y]) <= eps) acc.push(j)
      return acc
    }, []),
  )
  const isCore = neighbors.map((nb) => nb.length + 1 >= minPts)
  const labels = new Array(n).fill(-1)
  const types: PointType[] = new Array(n).fill('noise')
  let clusterId = -1

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1 || !isCore[i]) continue
    clusterId++
    const queue = [i]
    labels[i] = clusterId
    types[i] = 'core'
    while (queue.length > 0) {
      const cur = queue.shift()!
      for (const nb of neighbors[cur]) {
        if (labels[nb] === -1) {
          labels[nb] = clusterId
          types[nb] = isCore[nb] ? 'core' : 'border'
          if (isCore[nb]) queue.push(nb)
        }
      }
    }
  }
  // any point reachable from a core but not core itself = border, already handled
  // remaining unlabeled stay -1/noise
  return { labels, types }
}

export function DbscanLab() {
  const [dataset, setDataset] = useState<Dataset>('blobs')
  const [eps, setEps] = useState(0.8)
  const [minPts, setMinPts] = useState<3 | 4 | 5>(4)
  const [hovered, setHovered] = useState<number | null>(null)

  const data = dataset === 'blobs' ? BLOBS : MOONS

  const result = useMemo(() => dbscan(data, eps, minPts), [data, eps, minPts])

  const xScale = useMemo(() => scaleLinear().domain(DOMAIN).range([MARGIN.left, W - MARGIN.right]), [])
  const yScale = useMemo(() => scaleLinear().domain(DOMAIN).range([H - MARGIN.bottom, MARGIN.top]), [])

  const radiusPx = xScale(eps) - xScale(0)

  const counts = useMemo(() => {
    const clusters = new Set(result.labels.filter((l) => l >= 0)).size
    const noise = result.types.filter((t) => t === 'noise').length
    return { clusters, noise }
  }, [result])

  return (
    <VizPanel
      controls={
        <>
          <SegmentedControl<Dataset>
            label="dataset"
            value={dataset}
            onChange={(v) => setDataset(v)}
            options={[
              { value: 'blobs', label: 'blobs' },
              { value: 'moons', label: 'moons' },
            ]}
          />
          <VizSlider label="eps" value={eps} min={0.2} max={2} step={0.05} onChange={setEps} format={(v) => v.toFixed(2)} />
          <SegmentedControl<string>
            label="minPts"
            value={String(minPts)}
            onChange={(v) => setMinPts(Number(v) as 3 | 4 | 5)}
            options={[
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5' },
            ]}
          />
        </>
      }
      readout={
        <>
          <span>clusters: {counts.clusters}</span>
          <span>noise points: {counts.noise}</span>
          {dataset === 'moons' && (
            <span className="text-warn">k-means would fail here — it assumes round blobs; DBSCAN tracks the moon shapes</span>
          )}
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="DBSCAN clustering result">
        {/* eps radius circle for hovered/focused point */}
        {hovered !== null && (
          <circle
            cx={xScale(data[hovered].x)}
            cy={yScale(data[hovered].y)}
            r={radiusPx}
            fill="var(--accent)"
            fillOpacity={0.06}
            stroke="var(--accent)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}
        {data.map((p, i) => {
          const label = result.labels[i]
          const type = result.types[i]
          const color = label >= 0 ? PALETTE[label % PALETTE.length] : 'var(--color-ink-600)'
          const cx = xScale(p.x)
          const cy = yScale(p.y)
          return (
            <g key={i}>
              {type === 'noise' ? (
                <g
                  tabIndex={0}
                  role="img"
                  aria-label={`Point ${i}: noise`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                >
                  <line x1={cx - 4} y1={cy - 4} x2={cx + 4} y2={cy + 4} stroke={color} strokeWidth={2} />
                  <line x1={cx - 4} y1={cy + 4} x2={cx + 4} y2={cy - 4} stroke={color} strokeWidth={2} />
                </g>
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={type === 'border' ? 'none' : color}
                  stroke={color}
                  strokeWidth={type === 'border' ? 2 : 0}
                  fillOpacity={type === 'core' ? 0.9 : 1}
                  tabIndex={0}
                  role="img"
                  aria-label={`Point ${i}: ${type} of cluster ${label}`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                />
              )}
            </g>
          )
        })}
      </svg>
    </VizPanel>
  )
}
