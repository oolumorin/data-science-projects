import { useMemo } from 'react'
import katex from 'katex'

/** Renders a LaTeX string once via KaTeX. Display mode by default. */
export function Formula({ tex, inline = false }: { tex: string; inline?: boolean }) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: !inline,
        throwOnError: false,
      }),
    [tex, inline],
  )
  return (
    <span
      className={inline ? '' : 'my-2 block overflow-x-auto'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
