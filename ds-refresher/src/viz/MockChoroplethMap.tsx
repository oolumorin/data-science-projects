import { VizPanel } from '../components/ConceptCard'

// 5 simplified "regions" as polygons with a value driving a sequential fill.
const REGIONS: { name: string; value: number; d: string }[] = [
  { name: 'North', value: 0.85, d: 'M40,10 L160,10 L140,60 L60,60 Z' },
  { name: 'West', value: 0.35, d: 'M10,70 L80,70 L80,160 L10,150 Z' },
  { name: 'Central', value: 0.6, d: 'M85,70 L160,65 L165,140 L85,150 Z' },
  { name: 'East', value: 0.95, d: 'M165,68 L230,75 L225,145 L168,140 Z' },
  { name: 'South', value: 0.15, d: 'M60,165 L170,155 L175,195 L60,195 Z' },
]

function fillFor(value: number): string {
  // sequential scale: low -> faint accent, high -> solid accent
  const alpha = 0.15 + value * 0.8
  return `color-mix(in srgb, var(--accent) ${Math.round(alpha * 100)}%, var(--color-ink-900))`
}

export function MockChoroplethMap() {
  return (
    <VizPanel readout={<span>mock choropleth — shading encodes a per-region value (e.g. unemployment rate)</span>}>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-center">
        <svg viewBox="0 0 240 200" className="w-full max-w-[260px]" role="img" aria-label="Mock choropleth map with five shaded regions">
          {REGIONS.map((r) => (
            <path key={r.name} d={r.d} fill={fillFor(r.value)} stroke="var(--color-ink-700)" strokeWidth={1.5} />
          ))}
          {REGIONS.map((r) => {
            // rough label position: average of path bbox via simple heuristic per region
            const labelPos: Record<string, [number, number]> = {
              North: [100, 38],
              West: [45, 115],
              Central: [122, 110],
              East: [197, 108],
              South: [117, 178],
            }
            const [x, y] = labelPos[r.name]
            return (
              <text key={r.name} x={x} y={y} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--color-ink-100)">
                {r.name}
              </text>
            )
          })}
        </svg>

        {/* legend */}
        <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-start">
          <p className="font-mono text-[11px] text-ink-400">value</p>
          <div className="flex flex-row gap-1 sm:flex-col">
            {[0.95, 0.6, 0.35, 0.15].map((v) => (
              <div key={v} className="flex items-center gap-2">
                <span className="inline-block h-4 w-8 rounded-sm" style={{ background: fillFor(v) }} />
                <span className="font-mono text-[10px] text-ink-300">{v.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VizPanel>
  )
}
