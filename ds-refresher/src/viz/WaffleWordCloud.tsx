import { VizPanel } from '../components/ConceptCard'

// 10x10 waffle: device-type breakdown (out of 100 sessions)
const CATEGORIES = [
  { label: 'Mobile', count: 58, color: 'var(--accent)' },
  { label: 'Desktop', count: 32, color: 'var(--color-m5)' },
  { label: 'Tablet', count: 10, color: 'var(--color-m4)' },
]

const CELL = 18
const GAP = 2
const GRID = 10

function cellColor(index: number): string {
  let acc = 0
  for (const c of CATEGORIES) {
    acc += c.count
    if (index < acc) return c.color
  }
  return 'var(--color-ink-700)'
}

// static-ish word cloud: word + relative size + position (hand-placed, non-overlapping)
const WORDS: { text: string; size: number; x: number; y: number; color: string }[] = [
  { text: 'data', size: 34, x: 160, y: 60, color: 'var(--accent)' },
  { text: 'python', size: 24, x: 70, y: 100, color: 'var(--color-m5)' },
  { text: 'model', size: 26, x: 250, y: 100, color: 'var(--color-m3)' },
  { text: 'regression', size: 16, x: 250, y: 30, color: 'var(--color-ink-300)' },
  { text: 'plot', size: 20, x: 60, y: 35, color: 'var(--color-m4)' },
  { text: 'cluster', size: 14, x: 320, y: 65, color: 'var(--color-ink-300)' },
  { text: 'pandas', size: 18, x: 150, y: 125, color: 'var(--color-m8)' },
  { text: 'feature', size: 15, x: 30, y: 70, color: 'var(--color-ink-400)' },
  { text: 'train', size: 13, x: 320, y: 110, color: 'var(--color-ink-400)' },
  { text: 'overfit', size: 17, x: 230, y: 145, color: 'var(--color-bad)' },
  { text: 'ridge', size: 12, x: 110, y: 22, color: 'var(--color-ink-400)' },
  { text: 'metric', size: 13, x: 30, y: 135, color: 'var(--color-ink-400)' },
]

export function WaffleWordCloud() {
  return (
    <VizPanel
      readout={
        <span>
          Waffle: 58% mobile · 32% desktop · 10% tablet (100 sessions) — word cloud: word
          frequency in this module's glossary
        </span>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-[11px] text-ink-400">10×10 waffle chart — sessions by device</p>
          <svg viewBox={`0 0 ${GRID * (CELL + GAP)} ${GRID * (CELL + GAP)}`} className="mx-auto w-full max-w-[220px]" role="img" aria-label="Waffle chart of sessions by device type">
            {Array.from({ length: 100 }, (_, i) => {
              const row = Math.floor(i / GRID)
              const col = i % GRID
              return (
                <rect
                  key={i}
                  x={col * (CELL + GAP)}
                  y={row * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={cellColor(i)}
                  opacity={0.9}
                />
              )
            })}
          </svg>
          <div className="mt-2 flex flex-wrap justify-center gap-3 font-mono text-[10px] text-ink-300">
            {CATEGORIES.map((c) => (
              <span key={c.label} className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
                {c.label} {c.count}%
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-400">
            Each of the 100 squares is one unit — easier to read exact percentages than a pie,
            while still showing part-to-whole composition.
          </p>
        </div>

        <div>
          <p className="mb-2 font-mono text-[11px] text-ink-400">word cloud — term frequency</p>
          <svg viewBox="0 0 360 170" className="mx-auto w-full max-w-[320px]" role="img" aria-label="Word cloud of frequently used terms">
            {WORDS.map((w) => (
              <text
                key={w.text}
                x={w.x}
                y={w.y}
                fontSize={w.size}
                fontFamily="var(--font-mono)"
                fontWeight={w.size > 20 ? 'bold' : 'normal'}
                fill={w.color}
                textAnchor="middle"
              >
                {w.text}
              </text>
            ))}
          </svg>
          <p className="mt-2 text-xs leading-relaxed text-ink-400">
            Font size encodes frequency — quick for spotting the most common terms, but it
            doesn't support precise comparison (avoid for anything needing exact values).
          </p>
        </div>
      </div>
    </VizPanel>
  )
}
