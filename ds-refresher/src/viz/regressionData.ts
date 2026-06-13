/** Shared synthetic dataset for the Overfit Lab and Ridge Shrinkage interactives. */
import { mulberry32, gaussian } from '../lib/random'

export const N_POINTS = 30
export const MAX_DEGREE = 12
export const TRAIN_FRACTION = 0.7
export const NOISE_SD = 0.18

/** The "true" smooth signal: a gentle sinusoidal-cubic on [0, 1]. */
export function trueFn(x: number): number {
  return Math.sin(x * Math.PI * 1.6) * 0.5 + 0.6 * (x - 0.5) ** 3 * 4 + 0.5
}

export interface DataPoint {
  x: number
  y: number
  isTrain: boolean
}

/** Generate N noisy points from trueFn, seeded, with a fixed train/test split. */
export function generateData(seed: number): DataPoint[] {
  const rng = mulberry32(seed)
  const points: DataPoint[] = []
  for (let i = 0; i < N_POINTS; i++) {
    const x = (i + 0.5) / N_POINTS + (rng() - 0.5) * (0.5 / N_POINTS)
    const y = trueFn(x) + gaussian(rng) * NOISE_SD
    points.push({ x, y, isTrain: true })
  }
  // assign train/test by shuffling indices with the same rng stream continuation
  const order = points.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const nTrain = Math.round(N_POINTS * TRAIN_FRACTION)
  const testIdx = new Set(order.slice(nTrain))
  return points.map((p, i) => ({ ...p, isTrain: !testIdx.has(i) }))
}
