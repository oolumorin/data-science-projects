import { useState } from 'react'
import { VizPanel } from '../components/ConceptCard'

interface Choice {
  label: string
  to: string
}

interface Recommendation {
  chart: string
  thumbnail: 'line' | 'bar' | 'scatter' | 'box' | 'pie' | 'stackedBar' | 'histogram'
  warning: string
}

interface Node {
  id: string
  question?: string
  choices?: Choice[]
  recommendation?: Recommendation
}

const NODES: Record<string, Node> = {
  start: {
    id: 'start',
    question: 'What are you showing?',
    choices: [
      { label: 'Comparison between categories', to: 'comparison' },
      { label: 'Distribution of a variable', to: 'distribution' },
      { label: 'Relationship between two variables', to: 'relationship' },
      { label: 'Composition (parts of a whole)', to: 'composition' },
      { label: 'Trend over time', to: 'trend' },
    ],
  },
  comparison: {
    id: 'comparison',
    question: 'How many categories?',
    choices: [
      { label: 'A few (≤ 7)', to: 'comparison-few' },
      { label: 'Many, or need exact values', to: 'comparison-many' },
    ],
  },
  'comparison-few': {
    id: 'comparison-few',
    recommendation: {
      chart: 'Bar chart',
      thumbnail: 'bar',
      warning: "Don't truncate the y-axis — starting bars above zero exaggerates differences.",
    },
  },
  'comparison-many': {
    id: 'comparison-many',
    recommendation: {
      chart: 'Horizontal bar chart (sorted)',
      thumbnail: 'bar',
      warning: 'Sort by value, not alphabetically — alphabetical order hides the ranking that matters.',
    },
  },
  distribution: {
    id: 'distribution',
    question: 'Comparing distributions across groups, or one variable?',
    choices: [
      { label: 'One variable', to: 'distribution-one' },
      { label: 'Across several groups', to: 'distribution-groups' },
    ],
  },
  'distribution-one': {
    id: 'distribution-one',
    recommendation: {
      chart: 'Histogram',
      thumbnail: 'histogram',
      warning: 'Bin width changes the story — too few bins hide structure, too many show noise.',
    },
  },
  'distribution-groups': {
    id: 'distribution-groups',
    recommendation: {
      chart: 'Box plot',
      thumbnail: 'box',
      warning: 'Box plots hide multimodal distributions — consider a violin plot if shape matters.',
    },
  },
  relationship: {
    id: 'relationship',
    question: 'Two numeric variables, or with a third dimension?',
    choices: [
      { label: 'Two variables', to: 'relationship-two' },
      { label: 'A third variable (size or color)', to: 'relationship-three' },
    ],
  },
  'relationship-two': {
    id: 'relationship-two',
    recommendation: {
      chart: 'Scatter plot (with a regression line)',
      thumbnail: 'scatter',
      warning: 'Correlation ≠ causation — and check for outliers that dominate the fit.',
    },
  },
  'relationship-three': {
    id: 'relationship-three',
    recommendation: {
      chart: 'Bubble chart (scatter with size encoding)',
      thumbnail: 'scatter',
      warning: 'Area perception is nonlinear — use sqrt scaling for bubble size, and always include a size legend.',
    },
  },
  composition: {
    id: 'composition',
    question: 'Does composition change over time?',
    choices: [
      { label: 'No — a single snapshot', to: 'composition-snapshot' },
      { label: 'Yes — across time periods', to: 'composition-time' },
    ],
  },
  'composition-snapshot': {
    id: 'composition-snapshot',
    recommendation: {
      chart: 'Stacked / 100% bar — or a pie chart only if ≤ 5 slices',
      thumbnail: 'pie',
      warning: 'Avoid pie charts with more than ~5 slices — angle comparisons become unreliable.',
    },
  },
  'composition-time': {
    id: 'composition-time',
    recommendation: {
      chart: 'Stacked area chart',
      thumbnail: 'stackedBar',
      warning: "Pie charts can't show change over time — use stacked area or a small-multiples grid instead.",
    },
  },
  trend: {
    id: 'trend',
    question: 'Single series, or multiple series to compare?',
    choices: [
      { label: 'Single series', to: 'trend-single' },
      { label: 'Multiple series', to: 'trend-multi' },
    ],
  },
  'trend-single': {
    id: 'trend-single',
    recommendation: {
      chart: 'Line chart (or area chart for cumulative totals)',
      thumbnail: 'line',
      warning: "Don't connect points with gaps in time as if continuous — show breaks honestly.",
    },
  },
  'trend-multi': {
    id: 'trend-multi',
    recommendation: {
      chart: 'Multi-line chart (≤ 5 lines) or small multiples',
      thumbnail: 'line',
      warning: 'More than ~5 lines on one chart becomes "spaghetti" — split into small multiples.',
    },
  },
}

const ROOT = 'start'

function Thumbnail({ kind }: { kind: Recommendation['thumbnail'] }) {
  const stroke = 'var(--accent)'
  switch (kind) {
    case 'line':
      return (
        <svg viewBox="0 0 80 50" className="h-12 w-20">
          <polyline points="5,40 25,20 45,30 75,10" fill="none" stroke={stroke} strokeWidth={2.5} />
          <line x1={5} y1={45} x2={78} y2={45} stroke="var(--color-ink-600)" strokeWidth={1} />
        </svg>
      )
    case 'bar':
      return (
        <svg viewBox="0 0 80 50" className="h-12 w-20">
          {[30, 15, 35, 22].map((h, i) => (
            <rect key={i} x={5 + i * 18} y={45 - h} width={12} height={h} fill={stroke} opacity={0.8} />
          ))}
          <line x1={5} y1={45} x2={78} y2={45} stroke="var(--color-ink-600)" strokeWidth={1} />
        </svg>
      )
    case 'histogram':
      return (
        <svg viewBox="0 0 80 50" className="h-12 w-20">
          {[10, 25, 38, 30, 15, 8].map((h, i) => (
            <rect key={i} x={4 + i * 12} y={45 - h} width={11} height={h} fill={stroke} opacity={0.8} />
          ))}
          <line x1={4} y1={45} x2={78} y2={45} stroke="var(--color-ink-600)" strokeWidth={1} />
        </svg>
      )
    case 'scatter':
      return (
        <svg viewBox="0 0 80 50" className="h-12 w-20">
          {[[10, 35], [20, 25], [30, 30], [40, 18], [50, 22], [60, 10], [68, 15]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={3} fill={stroke} opacity={0.8} />
          ))}
          <line x1={5} y1={45} x2={78} y2={45} stroke="var(--color-ink-600)" strokeWidth={1} />
        </svg>
      )
    case 'box':
      return (
        <svg viewBox="0 0 80 50" className="h-12 w-20">
          <line x1={40} y1={5} x2={40} y2={45} stroke={stroke} strokeWidth={1.5} />
          <rect x={25} y={18} width={30} height={16} fill="none" stroke={stroke} strokeWidth={2} />
          <line x1={25} y1={26} x2={55} y2={26} stroke={stroke} strokeWidth={2} />
        </svg>
      )
    case 'pie':
      return (
        <svg viewBox="0 0 80 50" className="h-12 w-20">
          <circle cx={40} cy={25} r={18} fill="var(--color-ink-700)" />
          <path d="M 40 25 L 40 7 A 18 18 0 0 1 56 30 Z" fill={stroke} opacity={0.85} />
        </svg>
      )
    case 'stackedBar':
      return (
        <svg viewBox="0 0 80 50" className="h-12 w-20">
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={5 + i * 18} y={30} width={12} height={15} fill={stroke} opacity={0.5} />
              <rect x={5 + i * 18} y={15} width={12} height={15} fill={stroke} opacity={0.85} />
            </g>
          ))}
          <line x1={5} y1={45} x2={78} y2={45} stroke="var(--color-ink-600)" strokeWidth={1} />
        </svg>
      )
  }
}

export function ChartChooser() {
  const [path, setPath] = useState<string[]>([ROOT])
  const current = path[path.length - 1]
  const node = NODES[current]
  const isLeaf = !!node.recommendation

  const choose = (to: string) => setPath((p) => [...p, to])
  const restart = () => setPath([ROOT])
  const back = () => setPath((p) => (p.length > 1 ? p.slice(0, -1) : p))

  const breadcrumb = path
    .map((id) => {
      const n = NODES[id]
      return n.question ?? n.recommendation?.chart ?? id
    })
    .join(' → ')

  return (
    <VizPanel
      readout={<span>{breadcrumb}</span>}
      controls={
        <div className="flex flex-wrap gap-2">
          {path.length > 1 && (
            <button
              onClick={back}
              className="rounded-md border border-ink-700 px-3 py-1.5 font-mono text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
            >
              ‹ back
            </button>
          )}
          <button
            onClick={restart}
            className="rounded-md border border-ink-700 px-3 py-1.5 font-mono text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
          >
            ↺ restart
          </button>
        </div>
      }
    >
      {!isLeaf && (
        <div>
          <p className="text-[15px] font-medium leading-relaxed">{node.question}</p>
          <div className="mt-3 flex flex-col gap-2">
            {node.choices!.map((c) => (
              <button
                key={c.to}
                onClick={() => choose(c.to)}
                className="rounded-lg border border-ink-700 px-4 py-2.5 text-left text-sm text-ink-200 transition-colors hover:border-ink-500 hover:text-ink-100"
              >
                {c.label} →
              </button>
            ))}
          </div>
        </div>
      )}
      {isLeaf && node.recommendation && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-good/40 bg-good/5 p-5 text-center sm:flex-row sm:text-left">
          <Thumbnail kind={node.recommendation.thumbnail} />
          <div>
            <p className="text-sm text-ink-400">recommended chart</p>
            <p className="accent-text text-lg font-semibold">{node.recommendation.chart}</p>
            <p className="mt-2 text-sm leading-relaxed text-warn">⚠ {node.recommendation.warning}</p>
          </div>
        </div>
      )}
    </VizPanel>
  )
}
