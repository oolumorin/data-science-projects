import { useMemo, useState } from 'react'
import { VizPanel } from '../components/ConceptCard'
import { VizSlider } from '../components/VizSlider'
import { Formula } from '../components/Formula'
import { separableBlobs } from '../data/mlDatasets'
import { sigmoid } from '../lib/stats'

const DATA = separableBlobs(11, 40)

/** Same gradient-descent fit as LogisticThreshold, recomputed here so this file is self-contained. */
function fitLogReg(): [number, number, number] {
  let w0 = 0
  let w1 = 0
  let w2 = 0
  const lr = 0.05
  const n = DATA.length
  for (let iter = 0; iter < 500; iter++) {
    let g0 = 0
    let g1 = 0
    let g2 = 0
    for (const p of DATA) {
      const z = w0 + w1 * p.x + w2 * p.y
      const pred = sigmoid(z)
      const err = pred - p.label
      g0 += err
      g1 += err * p.x
      g2 += err * p.y
    }
    w0 -= (lr * g0) / n
    w1 -= (lr * g1) / n
    w2 -= (lr * g2) / n
  }
  return [w0, w1, w2]
}

const [W0, W1, W2] = fitLogReg()

export function ConfusionMatrixLab() {
  const [threshold, setThreshold] = useState(0.5)

  const { tp, fp, fn, tn, precision, recall, f1, accuracy } = useMemo(() => {
    let tp = 0
    let fp = 0
    let fn = 0
    let tn = 0
    for (const p of DATA) {
      const z = W0 + W1 * p.x + W2 * p.y
      const prob = sigmoid(z)
      const predicted = prob >= threshold ? 1 : 0
      if (p.label === 1 && predicted === 1) tp++
      else if (p.label === 0 && predicted === 0) tn++
      else if (p.label === 0 && predicted === 1) fp++
      else fn++
    }
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn)
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
    const accuracy = (tp + tn) / DATA.length
    return { tp, fp, fn, tn, precision, recall, f1, accuracy }
  }, [threshold])

  const cellStyle = (count: number, max: number, good: boolean) => ({
    backgroundColor: good ? 'var(--color-good)' : 'var(--color-bad)',
    opacity: 0.12 + 0.5 * (count / Math.max(1, max)),
  })

  const maxCount = Math.max(tp, fp, fn, tn, 1)

  return (
    <VizPanel
      controls={
        <VizSlider
          label="threshold"
          value={threshold}
          min={0.05}
          max={0.95}
          step={0.01}
          onChange={setThreshold}
          format={(v) => v.toFixed(2)}
        />
      }
      readout={
        <>
          <span>accuracy: {accuracy.toFixed(2)}</span>
          <span>precision: {precision.toFixed(2)}</span>
          <span>recall: {recall.toFixed(2)}</span>
          <span>F1: {f1.toFixed(2)}</span>
        </>
      }
    >
      <div className="grid gap-6 sm:grid-cols-[260px_1fr]">
        <div>
          <div className="grid grid-cols-2 gap-1 font-mono text-sm">
            <div className="col-span-2 text-center text-xs text-ink-400">predicted</div>
            <div />
            <div className="grid grid-cols-2 gap-1 text-center text-xs text-ink-400">
              <div>positive</div>
              <div>negative</div>
            </div>
            <div className="flex items-center text-xs text-ink-400 [writing-mode:vertical-rl]">actual</div>
            <div className="grid grid-cols-2 gap-1">
              <div
                className="flex flex-col items-center justify-center rounded-lg border border-ink-700 p-3 transition-all duration-300"
                style={cellStyle(tp, maxCount, true)}
              >
                <span className="text-xs text-ink-400">TP</span>
                <span className="text-2xl font-bold transition-all duration-300">{tp}</span>
              </div>
              <div
                className="flex flex-col items-center justify-center rounded-lg border border-ink-700 p-3 transition-all duration-300"
                style={cellStyle(fn, maxCount, false)}
              >
                <span className="text-xs text-ink-400">FN</span>
                <span className="text-2xl font-bold transition-all duration-300">{fn}</span>
              </div>
              <div
                className="flex flex-col items-center justify-center rounded-lg border border-ink-700 p-3 transition-all duration-300"
                style={cellStyle(fp, maxCount, false)}
              >
                <span className="text-xs text-ink-400">FP</span>
                <span className="text-2xl font-bold transition-all duration-300">{fp}</span>
              </div>
              <div
                className="flex flex-col items-center justify-center rounded-lg border border-ink-700 p-3 transition-all duration-300"
                style={cellStyle(tn, maxCount, true)}
              >
                <span className="text-xs text-ink-400">TN</span>
                <span className="text-2xl font-bold transition-all duration-300">{tn}</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-400">
            Rows = actual class (positive/negative), columns = predicted class.
          </p>
        </div>

        <div className="space-y-3 text-sm text-ink-300">
          <div>
            <Formula tex="\text{precision} = \dfrac{TP}{TP + FP}" />
            <Formula tex="\text{recall} = \dfrac{TP}{TP + FN}" />
            <Formula tex="F_1 = \dfrac{2 \cdot \text{precision} \cdot \text{recall}}{\text{precision} + \text{recall}}" />
          </div>
          <p>
            <strong>Recall</strong> matters when missing a positive is costly — e.g. disease
            screening, where a false negative sends a sick patient home.{' '}
            <strong>Precision</strong> matters when false alarms are costly — e.g. spam
            filtering, where a false positive buries a real email.
          </p>
        </div>
      </div>
    </VizPanel>
  )
}
