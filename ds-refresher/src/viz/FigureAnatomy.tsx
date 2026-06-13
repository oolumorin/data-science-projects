import { useState } from 'react'
import { VizPanel } from '../components/ConceptCard'

interface Part {
  id: string
  label: string
  code: string
  explanation: string
}

const PARTS: Part[] = [
  {
    id: 'figure',
    label: 'Figure',
    code: 'fig, ax = plt.subplots()',
    explanation:
      'The Figure is the entire canvas — the outer container that can hold one or more Axes (subplots), plus shared elements like a suptitle.',
  },
  {
    id: 'axes',
    label: 'Axes (plotting area)',
    code: 'ax  # the Axes object',
    explanation:
      'An Axes is a single "plot" — the region with data, ticks, labels, and a title. Most of the OO interface (ax.plot, ax.set_xlabel, …) operates on an Axes.',
  },
  {
    id: 'line',
    label: 'Line + markers (an Artist)',
    code: "ax.plot(x, y, marker='o')",
    explanation:
      'Everything drawn — lines, markers, text, patches — is an Artist. ax.plot() creates a Line2D artist and adds it to the Axes.',
  },
  {
    id: 'title',
    label: 'Title',
    code: "ax.set_title('Revenue by quarter')",
    explanation: 'A text Artist anchored above the Axes, set via ax.set_title().',
  },
  {
    id: 'xlabel',
    label: 'X-axis label',
    code: "ax.set_xlabel('Quarter')",
    explanation: 'Describes what the x-axis encodes — set with ax.set_xlabel().',
  },
  {
    id: 'ylabel',
    label: 'Y-axis label',
    code: "ax.set_ylabel('Revenue ($M)')",
    explanation: 'Describes what the y-axis encodes — set with ax.set_ylabel().',
  },
  {
    id: 'xticks',
    label: 'X tick labels',
    code: "ax.set_xticks([0,1,2,3]); ax.set_xticklabels(['Q1','Q2','Q3','Q4'])",
    explanation: 'The tick positions and labels along the x-axis, independently configurable.',
  },
  {
    id: 'yticks',
    label: 'Y tick labels',
    code: 'ax.set_yticks([0, 5, 10, 15])',
    explanation: 'The tick positions and labels along the y-axis.',
  },
  {
    id: 'spine-left',
    label: 'Left spine',
    code: "ax.spines['left'].set_visible(True)",
    explanation:
      'Spines are the box lines around the plotting area. Each side (left, right, top, bottom) can be styled or hidden independently via ax.spines[...].',
  },
  {
    id: 'spine-bottom',
    label: 'Bottom spine',
    code: "ax.spines['bottom'].set_position(('outward', 5))",
    explanation: 'The bottom spine doubles as the visual baseline for the x-axis.',
  },
  {
    id: 'grid',
    label: 'Grid',
    code: "ax.grid(True, alpha=0.3)",
    explanation: 'Gridlines extend from the ticks across the plotting area — toggled with ax.grid().',
  },
  {
    id: 'legend',
    label: 'Legend',
    code: "ax.legend(['Revenue'], loc='upper left')",
    explanation:
      'A separate Artist that labels each series. Built automatically from each plot call\'s label= argument, or set explicitly with ax.legend().',
  },
]

const W = 460
const H = 320

export function FigureAnatomy() {
  const [active, setActive] = useState<string | null>(null)
  const part = PARTS.find((p) => p.id === active)

  const isOn = (id: string) => active === id

  const hoverProps = (id: string) => ({
    onMouseEnter: () => setActive(id),
    onMouseLeave: () => setActive((a) => (a === id ? null : a)),
    onFocus: () => setActive(id),
    onBlur: () => setActive((a) => (a === id ? null : a)),
    tabIndex: 0,
    role: 'button' as const,
    'aria-label': PARTS.find((p) => p.id === id)?.label,
    style: { cursor: 'pointer' },
  })

  // a simple line+markers path for the demo plot
  const plotPts: [number, number][] = [
    [60, 250],
    [150, 180],
    [240, 210],
    [330, 110],
  ]
  const linePath = plotPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')

  return (
    <VizPanel readout={part ? <span className="font-mono text-[11px] accent-text">{part.code}</span> : <span>hover or focus any part of the figure</span>}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Annotated matplotlib figure">
          {/* figure border */}
          <rect
            x={2}
            y={2}
            width={W - 4}
            height={H - 4}
            fill="none"
            stroke={isOn('figure') ? 'var(--accent)' : 'var(--color-ink-700)'}
            strokeWidth={isOn('figure') ? 2.5 : 1.5}
            {...hoverProps('figure')}
          />
          <text x={8} y={16} fontSize={9} fontFamily="var(--font-mono)" fill={isOn('figure') ? 'var(--accent)' : 'var(--color-ink-500)'}>
            Figure
          </text>

          {/* axes (plotting area) background */}
          <rect
            x={50}
            y={40}
            width={350}
            height={220}
            fill={isOn('axes') ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--color-ink-950)'}
            stroke={isOn('axes') ? 'var(--accent)' : 'var(--color-ink-700)'}
            strokeWidth={isOn('axes') ? 2 : 1}
            {...hoverProps('axes')}
          />

          {/* grid */}
          <g opacity={isOn('grid') ? 1 : 0.5} {...hoverProps('grid')}>
            {[60, 110, 160, 210, 260].map((y) => (
              <line key={y} x1={50} x2={400} y1={y} y2={y} stroke={isOn('grid') ? 'var(--accent)' : 'var(--color-ink-800)'} strokeWidth={1} />
            ))}
            {[100, 175, 250, 325].map((x) => (
              <line key={x} x1={x} x2={x} y1={40} y2={260} stroke={isOn('grid') ? 'var(--accent)' : 'var(--color-ink-800)'} strokeWidth={1} />
            ))}
          </g>

          {/* line + markers */}
          <g {...hoverProps('line')}>
            <path d={linePath} fill="none" stroke={isOn('line') ? 'var(--accent)' : 'var(--color-m6)'} strokeWidth={isOn('line') ? 3 : 2} />
            {plotPts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={isOn('line') ? 5 : 4} fill={isOn('line') ? 'var(--accent)' : 'var(--color-m6)'} />
            ))}
          </g>

          {/* spines */}
          <line x1={50} y1={40} x2={50} y2={260} stroke={isOn('spine-left') ? 'var(--accent)' : 'var(--color-ink-400)'} strokeWidth={isOn('spine-left') ? 3 : 1.5} {...hoverProps('spine-left')} />
          <line x1={50} y1={260} x2={400} y2={260} stroke={isOn('spine-bottom') ? 'var(--accent)' : 'var(--color-ink-400)'} strokeWidth={isOn('spine-bottom') ? 3 : 1.5} {...hoverProps('spine-bottom')} />

          {/* x ticks */}
          <g {...hoverProps('xticks')}>
            {['Q1', 'Q2', 'Q3', 'Q4'].map((lab, i) => (
              <g key={lab}>
                <line x1={100 + i * 75} x2={100 + i * 75} y1={260} y2={266} stroke={isOn('xticks') ? 'var(--accent)' : 'var(--color-ink-400)'} strokeWidth={1.5} />
                <text x={100 + i * 75} y={280} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill={isOn('xticks') ? 'var(--accent)' : 'var(--color-ink-400)'}>
                  {lab}
                </text>
              </g>
            ))}
          </g>

          {/* y ticks */}
          <g {...hoverProps('yticks')}>
            {[0, 5, 10, 15].map((v, i) => (
              <g key={v}>
                <line x1={44} x2={50} y1={260 - i * 70} y2={260 - i * 70} stroke={isOn('yticks') ? 'var(--accent)' : 'var(--color-ink-400)'} strokeWidth={1.5} />
                <text x={40} y={260 - i * 70 + 3} textAnchor="end" fontSize={10} fontFamily="var(--font-mono)" fill={isOn('yticks') ? 'var(--accent)' : 'var(--color-ink-400)'}>
                  {v}
                </text>
              </g>
            ))}
          </g>

          {/* title */}
          <text x={225} y={26} textAnchor="middle" fontSize={13} fontWeight="bold" fill={isOn('title') ? 'var(--accent)' : 'var(--color-ink-100)'} {...hoverProps('title')}>
            Revenue by quarter
          </text>

          {/* x axis label */}
          <text x={225} y={300} textAnchor="middle" fontSize={11} fill={isOn('xlabel') ? 'var(--accent)' : 'var(--color-ink-300)'} {...hoverProps('xlabel')}>
            Quarter
          </text>

          {/* y axis label */}
          <text x={16} y={150} textAnchor="middle" fontSize={11} fill={isOn('ylabel') ? 'var(--accent)' : 'var(--color-ink-300)'} transform="rotate(-90 16 150)" {...hoverProps('ylabel')}>
            Revenue ($M)
          </text>

          {/* legend */}
          <g {...hoverProps('legend')}>
            <rect x={300} y={48} width={92} height={26} rx={4} fill="var(--color-ink-900)" stroke={isOn('legend') ? 'var(--accent)' : 'var(--color-ink-600)'} strokeWidth={isOn('legend') ? 2 : 1} />
            <line x1={308} x2={324} y1={61} y2={61} stroke="var(--color-m6)" strokeWidth={2} />
            <circle cx={316} cy={61} r={3} fill="var(--color-m6)" />
            <text x={330} y={64} fontSize={10} fontFamily="var(--font-mono)" fill={isOn('legend') ? 'var(--accent)' : 'var(--color-ink-300)'}>
              Revenue
            </text>
          </g>
        </svg>

        <aside className="rounded-lg border border-ink-800 bg-ink-950 p-4" aria-live="polite">
          {part ? (
            <>
              <h3 className="font-semibold">{part.label}</h3>
              <p className="accent-text mt-2 font-mono text-xs">{part.code}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">{part.explanation}</p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-ink-400">
              Hover or tab through every labeled part of the figure — each maps to a line of
              matplotlib's object-oriented API.
            </p>
          )}
        </aside>
      </div>
    </VizPanel>
  )
}
