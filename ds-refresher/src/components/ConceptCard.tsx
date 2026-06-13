import type { ReactNode } from 'react'

interface ConceptCardProps {
  title: string
  /** ≤150 words. The visual does the teaching; this is the caption. */
  children?: ReactNode
  /** the interactive — rendered first so the eye lands on the diagram */
  viz?: ReactNode
  /** code snippet(s), collapsed by default */
  code?: ReactNode
  id?: string
}

/** The standard content unit: visual first, short prose, collapsed code. */
export function ConceptCard({ title, children, viz, code, id }: ConceptCardProps) {
  return (
    <section id={id} className="scroll-mt-24 py-10 first:pt-6">
      <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold">
        <span className="inline-block h-5 w-1 rounded-full accent-bg" aria-hidden />
        {title}
      </h2>
      {viz && <div className="mb-4">{viz}</div>}
      {children && (
        <div className="max-w-prose space-y-3 text-[15px] leading-relaxed text-ink-300">
          {children}
        </div>
      )}
      {code}
    </section>
  )
}

/** Shared container for SVG interactives: panel chrome + caption row. */
export function VizPanel({
  children,
  controls,
  readout,
}: {
  children: ReactNode
  controls?: ReactNode
  readout?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-4">
      {children}
      {readout && (
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-xs text-ink-300">
          {readout}
        </div>
      )}
      {controls && <div className="mt-4 space-y-3">{controls}</div>}
    </div>
  )
}
