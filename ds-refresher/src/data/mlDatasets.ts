/** Shared seeded toy 2D datasets used across Module 8 (Machine Learning) interactives. */
import { mulberry32, gaussian } from '../lib/random'

export interface Point2 {
  x: number
  y: number
  /** class label: 0 or 1 */
  label: 0 | 1
}

/**
 * Two overlapping gaussian blobs, ~40 points total, labels 0/1.
 * Used by KNN, decision tree, logistic regression, SVM.
 */
export function twoBlobs(seed = 42, n = 40): Point2[] {
  const rng = mulberry32(seed)
  const pts: Point2[] = []
  const centers: [number, number, 0 | 1][] = [
    [3, 6, 0],
    [7, 4, 1],
  ]
  for (let i = 0; i < n; i++) {
    const [cx, cy, label] = centers[i % 2]
    const x = cx + gaussian(rng) * 1.6
    const y = cy + gaussian(rng) * 1.6
    pts.push({ x: clamp01(x), y: clamp01(y), label })
  }
  return pts
}

/** A more linearly-separable two-blob set for SVM / logistic regression. */
export function separableBlobs(seed = 11, n = 40): Point2[] {
  const rng = mulberry32(seed)
  const pts: Point2[] = []
  const centers: [number, number, 0 | 1][] = [
    [2.8, 6.5, 0],
    [7.2, 3.5, 1],
  ]
  for (let i = 0; i < n; i++) {
    const [cx, cy, label] = centers[i % 2]
    const x = cx + gaussian(rng) * 1.3
    const y = cy + gaussian(rng) * 1.3
    pts.push({ x: clamp01(x), y: clamp01(y), label })
  }
  return pts
}

function clamp01(v: number): number {
  return Math.min(10, Math.max(0, v))
}

export interface Point {
  x: number
  y: number
}

/** ~60 points in 3 seeded gaussian blobs for k-means. */
export function threeBlobs(seed = 7, perBlob = 20): Point[] {
  const rng = mulberry32(seed)
  const centers: [number, number][] = [
    [2.5, 2.5],
    [7.5, 2.5],
    [5, 7.5],
  ]
  const pts: Point[] = []
  for (const [cx, cy] of centers) {
    for (let i = 0; i < perBlob; i++) {
      pts.push({
        x: clamp10(cx + gaussian(rng) * 1.0),
        y: clamp10(cy + gaussian(rng) * 1.0),
      })
    }
  }
  return pts
}

function clamp10(v: number): number {
  return Math.min(10, Math.max(0, v))
}

/** ~12 points for hierarchical clustering — small, spread enough to show clear merges. */
export function smallPoints(seed = 5, n = 12): Point[] {
  const rng = mulberry32(seed)
  const centers: [number, number][] = [
    [2, 2],
    [2.5, 7],
    [8, 4],
  ]
  const pts: Point[] = []
  for (let i = 0; i < n; i++) {
    const [cx, cy] = centers[i % centers.length]
    pts.push({
      x: clamp10(cx + gaussian(rng) * 0.9),
      y: clamp10(cy + gaussian(rng) * 0.9),
    })
  }
  return pts
}

/** Two interleaved half-moons, seeded — classic DBSCAN demo set. */
export function moons(seed = 3, perMoon = 35): Point[] {
  const rng = mulberry32(seed)
  const pts: Point[] = []
  // moon 1: upper arc
  for (let i = 0; i < perMoon; i++) {
    const t = (i / perMoon) * Math.PI
    const x = 5 + 4 * Math.cos(t)
    const y = 5 + 4 * Math.sin(t) - 1
    pts.push({
      x: x + gaussian(rng) * 0.25,
      y: y + gaussian(rng) * 0.25,
    })
  }
  // moon 2: lower arc, shifted
  for (let i = 0; i < perMoon; i++) {
    const t = (i / perMoon) * Math.PI
    const x = 7 - 4 * Math.cos(t)
    const y = 7 - 4 * Math.sin(t) - 1
    pts.push({
      x: x + gaussian(rng) * 0.25,
      y: y + gaussian(rng) * 0.25,
    })
  }
  return pts
}

/** ~60 points in 3 blobs, for the DBSCAN "blobs" toggle (denser, well separated). */
export function dbscanBlobs(seed = 9, perBlob = 20): Point[] {
  const rng = mulberry32(seed)
  const centers: [number, number][] = [
    [2.5, 2.5],
    [7.5, 2.5],
    [5, 7.5],
  ]
  const pts: Point[] = []
  for (const [cx, cy] of centers) {
    for (let i = 0; i < perBlob; i++) {
      pts.push({
        x: clamp10(cx + gaussian(rng) * 0.7),
        y: clamp10(cy + gaussian(rng) * 0.7),
      })
    }
  }
  return pts
}
