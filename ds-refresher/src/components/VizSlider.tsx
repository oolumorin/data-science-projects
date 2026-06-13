import { useId } from 'react'

interface VizSliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  /** format the value readout, e.g. (v) => v.toFixed(2) */
  format?: (v: number) => string
  disabled?: boolean
}

/** Labeled, keyboard-operable slider used across all interactives. */
export function VizSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = String,
  disabled = false,
}: VizSliderProps) {
  const id = useId()
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="w-36 shrink-0 text-sm text-ink-300">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
        aria-valuetext={format(value)}
      />
      <span className="w-16 shrink-0 text-right font-mono text-sm accent-text">
        {format(value)}
      </span>
    </div>
  )
}

/** Small segmented control for discrete choices (join type, scaling method...). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      {label && <span className="mr-1 text-sm text-ink-300">{label}</span>}
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`rounded-md border px-3 py-1 font-mono text-xs transition-colors ${
            value === opt.value
              ? 'accent-border accent-text border bg-ink-800'
              : 'border-ink-700 text-ink-400 hover:border-ink-600 hover:text-ink-100'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
