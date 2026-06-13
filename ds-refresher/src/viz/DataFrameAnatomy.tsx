import { useState } from 'react'
import { VizPanel } from '../components/ConceptCard'

const COLUMNS = ['city', 'price', 'sqft']
const DTYPES = ['object', 'int64', 'int64']
const ROWS = [
  ['Austin', '320', '1200'],
  ['Boston', '540', '900'],
  ['Denver', '410', '1100'],
]
const INDEX = ['0', '1', '2']

type Part = 'index' | 'columns' | 'values' | 'dtypes' | null

const CELL_W = 70
const CELL_H = 28
const IDX_W = 40

export function DataFrameAnatomy() {
  const [hover, setHover] = useState<Part>(null)

  const tableX = IDX_W
  const headerY = 0
  const dtypeY = CELL_H
  const firstRowY = CELL_H * 2

  const highlight = (p: Part) => (hover === p ? 'var(--accent)' : 'var(--color-ink-800)')
  const textHighlight = (p: Part) => (hover === p ? 'var(--color-ink-950)' : 'var(--color-ink-100)')

  return (
    <VizPanel
      readout={
        <span>
          hover the diagram — <span className="accent-text">index</span>,{' '}
          <span className="accent-text">columns</span>, <span className="accent-text">values</span>,{' '}
          <span className="accent-text">dtypes</span>
        </span>
      }
    >
      <svg
        viewBox={`0 0 ${tableX + COLUMNS.length * CELL_W + 10} ${firstRowY + ROWS.length * CELL_H + 10}`}
        className="mx-auto w-full max-w-[360px]"
        role="img"
        aria-label="DataFrame anatomy diagram: index, columns, values, dtypes"
      >
        {/* column header labels */}
        {COLUMNS.map((c, ci) => (
          <g key={c} onMouseEnter={() => setHover('columns')} onMouseLeave={() => setHover(null)}>
            <rect
              x={tableX + ci * CELL_W}
              y={headerY}
              width={CELL_W}
              height={CELL_H}
              fill={highlight('columns')}
              stroke="var(--color-ink-700)"
              className="transition-all duration-200"
            />
            <text
              x={tableX + ci * CELL_W + CELL_W / 2}
              y={headerY + CELL_H / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fontFamily="var(--font-mono)"
              fill={textHighlight('columns')}
            >
              {c}
            </text>
          </g>
        ))}

        {/* dtypes row */}
        {DTYPES.map((d, ci) => (
          <g key={d + ci} onMouseEnter={() => setHover('dtypes')} onMouseLeave={() => setHover(null)}>
            <rect
              x={tableX + ci * CELL_W}
              y={dtypeY}
              width={CELL_W}
              height={CELL_H}
              fill={highlight('dtypes')}
              stroke="var(--color-ink-700)"
              className="transition-all duration-200"
            />
            <text
              x={tableX + ci * CELL_W + CELL_W / 2}
              y={dtypeY + CELL_H / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fontFamily="var(--font-mono)"
              fill={textHighlight('dtypes')}
              fontStyle="italic"
            >
              {d}
            </text>
          </g>
        ))}

        {/* index column */}
        {INDEX.map((idx, ri) => (
          <g key={idx} onMouseEnter={() => setHover('index')} onMouseLeave={() => setHover(null)}>
            <rect
              x={0}
              y={firstRowY + ri * CELL_H}
              width={IDX_W}
              height={CELL_H}
              fill={highlight('index')}
              stroke="var(--color-ink-700)"
              className="transition-all duration-200"
            />
            <text
              x={IDX_W / 2}
              y={firstRowY + ri * CELL_H + CELL_H / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fontFamily="var(--font-mono)"
              fill={textHighlight('index')}
            >
              {idx}
            </text>
          </g>
        ))}

        {/* values grid */}
        {ROWS.map((row, ri) =>
          row.map((val, ci) => (
            <g key={`${ri}-${ci}`} onMouseEnter={() => setHover('values')} onMouseLeave={() => setHover(null)}>
              <rect
                x={tableX + ci * CELL_W}
                y={firstRowY + ri * CELL_H}
                width={CELL_W}
                height={CELL_H}
                fill={highlight('values')}
                stroke="var(--color-ink-700)"
                className="transition-all duration-200"
              />
              <text
                x={tableX + ci * CELL_W + CELL_W / 2}
                y={firstRowY + ri * CELL_H + CELL_H / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontFamily="var(--font-mono)"
                fill={textHighlight('values')}
              >
                {val}
              </text>
            </g>
          )),
        )}

        {/* corner label */}
        <text x={IDX_W / 2} y={headerY + CELL_H / 2} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--color-ink-600)">
          {'#'}
        </text>
      </svg>
    </VizPanel>
  )
}
