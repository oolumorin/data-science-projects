import { useMemo, useState } from 'react'
import { VizPanel } from '../components/ConceptCard'
import { SegmentedControl } from '../components/VizSlider'

const N_USERS = 8
const N_ITEMS = 10

// 0 = no rating, 1-5 = rating
const RATINGS: number[][] = [
  [5, 0, 4, 0, 1, 0, 5, 4, 0, 2],
  [4, 0, 5, 0, 0, 0, 4, 5, 0, 1],
  [0, 5, 0, 4, 0, 5, 0, 0, 4, 0],
  [1, 0, 2, 0, 5, 0, 1, 0, 0, 5],
  [5, 0, 4, 0, 2, 0, 5, 0, 0, 1],
  [0, 4, 0, 5, 0, 4, 0, 0, 5, 0],
  [0, 0, 0, 0, 4, 0, 0, 4, 0, 5],
  [4, 5, 4, 0, 0, 0, 4, 0, 0, 0],
]

type Mode = 'content' | 'collaborative'

/** Cosine similarity between two vectors, considering only positions where both are nonzero. */
function cosineSim(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  let shared = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] > 0 && b[i] > 0) {
      dot += a[i] * b[i]
      shared++
    }
    if (a[i] > 0) na += a[i] * a[i]
    if (b[i] > 0) nb += b[i] * b[i]
  }
  if (shared === 0 || na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

function column(matrix: number[][], j: number): number[] {
  return matrix.map((row) => row[j])
}

const CELL = 32

export function RecommenderMatrix() {
  const [mode, setMode] = useState<Mode>('content')
  const [target, setTarget] = useState<[number, number]>([2, 6]) // user 2, item 6 (0-indexed)

  const [targetUser, targetItem] = target

  // content-based: similarity between target item column and every other item column
  const itemSims = useMemo(() => {
    const targetCol = column(RATINGS, targetItem)
    return Array.from({ length: N_ITEMS }, (_, j) => cosineSim(targetCol, column(RATINGS, j)))
  }, [targetItem])

  // collaborative: similarity between target user row and every other user row
  const userSims = useMemo(() => {
    const targetRow = RATINGS[targetUser]
    return RATINGS.map((row) => cosineSim(targetRow, row))
  }, [targetUser])

  // prediction walkthrough for the target cell
  const walkthrough = useMemo(() => {
    if (mode === 'collaborative') {
      // find similar users who rated targetItem
      const candidates = RATINGS.map((row, u) => ({ u, sim: userSims[u], rating: row[targetItem] }))
        .filter((c) => c.u !== targetUser && c.rating > 0 && c.sim > 0)
        .sort((a, b) => b.sim - a.sim)
        .slice(0, 2)
      if (candidates.length === 0) return null
      const num = candidates.reduce((s, c) => s + c.sim * c.rating, 0)
      const den = candidates.reduce((s, c) => s + c.sim, 0)
      const pred = den > 0 ? num / den : 0
      return {
        kind: 'collaborative' as const,
        candidates,
        pred,
      }
    } else {
      const candidates = itemSims
        .map((sim, j) => ({ j, sim, rating: RATINGS[targetUser][j] }))
        .filter((c) => c.j !== targetItem && c.rating > 0 && c.sim > 0)
        .sort((a, b) => b.sim - a.sim)
        .slice(0, 2)
      if (candidates.length === 0) return null
      const num = candidates.reduce((s, c) => s + c.sim * c.rating, 0)
      const den = candidates.reduce((s, c) => s + c.sim, 0)
      const pred = den > 0 ? num / den : 0
      return {
        kind: 'content' as const,
        candidates,
        pred,
      }
    }
  }, [mode, targetUser, targetItem, itemSims, userSims])

  const W = CELL * (N_ITEMS + 1) + 10
  const H = CELL * (N_USERS + 1) + 10

  const star = (r: number) => (r === 0 ? '·' : '★'.repeat(r))

  return (
    <VizPanel
      controls={
        <SegmentedControl
          label="mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'content', label: 'content-based (item similarity)' },
            { value: 'collaborative', label: 'collaborative (user similarity)' },
          ]}
        />
      }
      readout={
        <>
          <span>
            target: user {targetUser + 1} × item {targetItem + 1}
          </span>
          {walkthrough && (
            <span className="block w-full text-ink-300">
              {walkthrough.kind === 'collaborative'
                ? `most similar users ${walkthrough.candidates.map((c) => `${c.u + 1} (rated ${c.rating})`).join(' and ')} → predict ≈ ${walkthrough.pred.toFixed(1)}`
                : `most similar items ${walkthrough.candidates.map((c) => `${c.j + 1} (you rated ${c.rating})`).join(' and ')} → predict ≈ ${walkthrough.pred.toFixed(1)}`}
            </span>
          )}
        </>
      }
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="User-item rating matrix heatmap">
        {/* column headers */}
        {Array.from({ length: N_ITEMS }, (_, j) => (
          <text
            key={`item-${j}`}
            x={CELL * (j + 1.5) + 5}
            y={CELL * 0.7}
            textAnchor="middle"
            fontSize={10}
            fontFamily="var(--font-mono)"
            fill={j === targetItem ? 'var(--accent)' : 'var(--color-ink-400)'}
          >
            i{j + 1}
          </text>
        ))}
        {/* row headers */}
        {Array.from({ length: N_USERS }, (_, i) => (
          <text
            key={`user-${i}`}
            x={CELL * 0.5 + 5}
            y={CELL * (i + 1.7)}
            textAnchor="middle"
            fontSize={10}
            fontFamily="var(--font-mono)"
            fill={i === targetUser ? 'var(--accent)' : 'var(--color-ink-400)'}
          >
            u{i + 1}
          </text>
        ))}
        {/* cells */}
        {RATINGS.map((row, i) =>
          row.map((r, j) => {
            const isTarget = i === targetUser && j === targetItem
            const highlight = mode === 'content' ? itemSims[j] : userSims[i]
            const isRelevant = mode === 'content' ? j !== targetItem && highlight > 0.3 : i !== targetUser && highlight > 0.3
            return (
              <g key={`${i}-${j}`}>
                <rect
                  x={CELL * (j + 1) + 5}
                  y={CELL * i + CELL + 5}
                  width={CELL - 2}
                  height={CELL - 2}
                  rx={3}
                  fill={isTarget ? 'var(--color-warn)' : isRelevant ? 'var(--accent)' : 'var(--color-ink-800)'}
                  fillOpacity={isTarget ? 0.3 : isRelevant ? 0.18 + highlight * 0.25 : 1}
                  stroke={isTarget ? 'var(--color-warn)' : 'var(--color-ink-700)'}
                  strokeWidth={isTarget ? 2 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => setTarget([i, j])}
                  tabIndex={0}
                  role="button"
                  aria-label={`User ${i + 1}, item ${j + 1}, rating ${r || 'unrated'}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setTarget([i, j])
                    }
                  }}
                />
                <text
                  x={CELL * (j + 1.5) + 5}
                  y={CELL * i + CELL * 1.6 + 5}
                  textAnchor="middle"
                  fontSize={9}
                  fill={r === 0 ? 'var(--color-ink-600)' : 'var(--color-warn)'}
                >
                  {star(r)}
                </text>
              </g>
            )
          }),
        )}
      </svg>
    </VizPanel>
  )
}
