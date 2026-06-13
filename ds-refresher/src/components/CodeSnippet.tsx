import { useMemo, useState } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-sql'

interface CodeSnippetProps {
  lang: 'python' | 'sql'
  code: string
  /** optional title shown in the header bar */
  title?: string
  /** 1-based line numbers to emphasize */
  highlightLines?: number[]
  /** start expanded instead of behind "Show the code" */
  defaultOpen?: boolean
}

export function CodeSnippet({
  lang,
  code,
  title,
  highlightLines = [],
  defaultOpen = false,
}: CodeSnippetProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)

  const trimmed = code.trim()
  const lines = useMemo(() => {
    const html = Prism.highlight(trimmed, Prism.languages[lang], lang)
    return html.split('\n')
  }, [trimmed, lang])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(trimmed)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-2 rounded-md border border-ink-700 bg-ink-900 px-3 py-1.5 font-mono text-xs text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
      >
        <span aria-hidden>{'</>'}</span> Show the code{title ? ` — ${title}` : ''}
      </button>
    )
  }

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-ink-700 bg-ink-900">
      <div className="flex items-center justify-between border-b border-ink-800 px-3 py-1.5">
        <span className="font-mono text-xs text-ink-400">
          {title ?? lang}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={copy}
            className="font-mono text-xs text-ink-400 transition-colors hover:text-ink-100"
          >
            {copied ? 'copied ✓' : 'copy'}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="font-mono text-xs text-ink-400 transition-colors hover:text-ink-100"
            aria-label="Hide code"
          >
            hide
          </button>
        </div>
      </div>
      <pre className={`language-${lang} overflow-x-auto p-3`}>
        <code className={`language-${lang}`}>
          {lines.map((line, i) => (
            <span
              key={i}
              className={`block px-1 ${
                highlightLines.includes(i + 1) ? 'bg-ink-700/60' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: line === '' ? '&nbsp;' : line }}
            />
          ))}
        </code>
      </pre>
    </div>
  )
}
