import { useMemo, useState } from 'react'
import { VizPanel } from '../components/ConceptCard'
import { SegmentedControl } from '../components/VizSlider'

type Shape = [number, number]

interface Preset {
  label: string
  a: Shape
  b: Shape
}

const PRESETS: Preset[] = [
  { label: '(3,4) + (4,)', a: [3, 4], b: [1, 4] },
  { label: '(3,1) + (1,4)', a: [3, 1], b: [1, 4] },
  { label: '(3,4) + (3,1)', a: [3, 4], b: [3, 1] },
  { label: '(2,3) + (3,2)', a: [2, 3], b: [3, 2] },
]

const CELL = 28
const GAP = 3

/** Determine the broadcast result shape per pair, aligned on trailing dims. */
function broadcastResult(a: Shape, b: Shape): { ok: boolean; shape: Shape; reason: string } {
  const dims: [number, number][] = [
    [a[0], b[0]],
    [a[1], b[1]],
  ]
  const out: number[] = []
  for (const [x, y] of dims) {
    if (x === y) out.push(x)
    else if (x === 1) out.push(y)
    else if (y === 1) out.push(x)
    else
      return {
        ok: false,
        shape: [0, 0],
        reason: `dim ${x} vs ${y} — neither equals 1, and they differ`,
      }
  }
  return { ok: true, shape: out as Shape, reason: 'every trailing dim pairs equal or 1' }
}

function Grid({
  shape,
  x0,
  y0,
  color,
  ghostTo,
  label,
}: {
  shape: Shape
  x0: number
  y0: number
  color: string
  /** if set, render translucent ghost copies stretched to this shape */
  ghostTo?: Shape
  label: string
}) {
  const [rows, cols] = shape
  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={x0 + c * (CELL + GAP)}
          y={y0 + r * (CELL + GAP)}
          width={CELL}
          height={CELL}
          rx={4}
          fill={color}
          className="transition-all duration-300"
        />,
      )
    }
  }

  const ghosts = []
  if (ghostTo) {
    const [gr, gc] = ghostTo
    for (let r = 0; r < gr; r++) {
      for (let c = 0; c < gc; c++) {
        // skip cells already drawn as real cells
        if (r < rows && c < cols) continue
        ghosts.push(
          <rect
            key={`ghost-${r}-${c}`}
            x={x0 + c * (CELL + GAP)}
            y={y0 + r * (CELL + GAP)}
            width={CELL}
            height={CELL}
            rx={4}
            fill={color}
            opacity={0.18}
            stroke={color}
            strokeOpacity={0.35}
            strokeDasharray="2 2"
            className="transition-all duration-300"
          />,
        )
      }
    }
  }

  const w = (ghostTo ? ghostTo[1] : cols) * (CELL + GAP) - GAP
  const h = (ghostTo ? ghostTo[0] : rows) * (CELL + GAP) - GAP

  return (
    <g>
      {ghosts}
      {cells}
      <text x={x0} y={y0 - 10} fontSize={11} fill="var(--color-ink-400)" fontFamily="var(--font-mono)">
        {label}
      </text>
      <rect
        x={x0 - 4}
        y={y0 - 4}
        width={w + 8}
        height={h + 8}
        rx={6}
        fill="none"
        stroke="var(--color-ink-700)"
        strokeWidth={1}
      />
    </g>
  )
}

export function BroadcastingViz() {
  const [presetIdx, setPresetIdx] = useState(0)
  const preset = PRESETS[presetIdx]
  const result = useMemo(() => broadcastResult(preset.a, preset.b), [preset])

  const aGhost = result.ok ? result.shape : undefined
  const bGhost = result.ok ? result.shape : undefined

  // layout: A on the left, B below it, ghosted shapes overlay to result size
  const aW = (aGhost ? aGhost[1] : preset.a[1]) * (CELL + GAP)
  const aH = (aGhost ? aGhost[0] : preset.a[0]) * (CELL + GAP)
  const bH = (bGhost ? bGhost[0] : preset.b[0]) * (CELL + GAP)

  const x0 = 30
  const aY = 30
  const bY = aY + aH + 50
  const viewH = Math.max(220, bY + bH + 40)

  return (
    <VizPanel
      controls={
        <SegmentedControl
          label="shape pair"
          value={preset.label}
          onChange={(v: string) => setPresetIdx(PRESETS.findIndex((p) => p.label === v))}
          options={PRESETS.map((p) => ({ value: p.label, label: p.label }))}
        />
      }
      readout={
        result.ok ? (
          <>
            <span>
              result shape: <span className="accent-text">({result.shape[0]}, {result.shape[1]})</span>
            </span>
            <span className="text-good">broadcasts OK — {result.reason}</span>
          </>
        ) : (
          <span className="text-bad">
            ValueError: shapes {preset.a.join('×')} and {preset.b.join('×')} not broadcastable — {result.reason}
          </span>
        )
      }
    >
      <svg
        viewBox={`0 0 ${Math.max(260, aW + 60)} ${viewH}`}
        className="w-full max-w-[420px]"
        role="img"
        aria-label={`Broadcasting shapes ${preset.a.join('x')} and ${preset.b.join('x')}`}
      >
        <Grid shape={preset.a} x0={x0} y0={aY} color="var(--accent)" ghostTo={result.ok ? aGhost : undefined} label={`A: (${preset.a[0]}, ${preset.a[1]})`} />
        <Grid
          shape={preset.b}
          x0={x0}
          y0={bY}
          color="var(--color-m5)"
          ghostTo={result.ok ? bGhost : undefined}
          label={`B: (${preset.b[0]}, ${preset.b[1]})`}
        />
        {!result.ok && (
          <text x={x0} y={viewH - 10} fontSize={11} fill="var(--color-bad)" fontFamily="var(--font-mono)">
            ✗ broadcasting fails
          </text>
        )}
      </svg>
    </VizPanel>
  )
}
