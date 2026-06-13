/** Math helpers shared by the interactives. Pure functions, no deps. */

export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

export const variance = (xs: number[]) => {
  const m = mean(xs)
  return mean(xs.map((x) => (x - m) ** 2))
}

export const std = (xs: number[]) => Math.sqrt(variance(xs))

export function pearson(xs: number[], ys: number[]): number {
  const mx = mean(xs)
  const my = mean(ys)
  let num = 0
  let dx2 = 0
  let dy2 = 0
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - mx
    const dy = ys[i] - my
    num += dx * dy
    dx2 += dx * dx
    dy2 += dy * dy
  }
  const den = Math.sqrt(dx2 * dy2)
  return den === 0 ? 0 : num / den
}

/** Ordinary least squares for y = a + b·x. */
export function linreg(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const mx = mean(xs)
  const my = mean(ys)
  let num = 0
  let den = 0
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  return { slope, intercept: my - slope * mx }
}

export const mse = (yTrue: number[], yPred: number[]) =>
  mean(yTrue.map((y, i) => (y - yPred[i]) ** 2))

export function r2Score(yTrue: number[], yPred: number[]): number {
  const m = mean(yTrue)
  const ssRes = yTrue.reduce((s, y, i) => s + (y - yPred[i]) ** 2, 0)
  const ssTot = yTrue.reduce((s, y) => s + (y - m) ** 2, 0)
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot
}

/**
 * Polynomial (optionally ridge-regularized) least squares fit.
 * Solves (XᵀX + αI)w = Xᵀy via Gaussian elimination. Degree kept small (≤12).
 * Returns coefficients [w0, w1, ... w_degree], lowest order first.
 */
export function polyfit(xs: number[], ys: number[], degree: number, alpha = 0): number[] {
  const n = xs.length
  const d = degree + 1
  // build normal equations
  const XtX: number[][] = Array.from({ length: d }, () => new Array(d).fill(0))
  const Xty: number[] = new Array(d).fill(0)
  for (let i = 0; i < n; i++) {
    const pows: number[] = new Array(d)
    pows[0] = 1
    for (let p = 1; p < d; p++) pows[p] = pows[p - 1] * xs[i]
    for (let r = 0; r < d; r++) {
      Xty[r] += pows[r] * ys[i]
      for (let c = 0; c < d; c++) XtX[r][c] += pows[r] * pows[c]
    }
  }
  // ridge penalty (skip intercept, as sklearn does)
  for (let r = 1; r < d; r++) XtX[r][r] += alpha
  return solve(XtX, Xty)
}

export const polyval = (coefs: number[], x: number) =>
  coefs.reduce((acc, c, p) => acc + c * x ** p, 0)

/** Gaussian elimination with partial pivoting. */
export function solve(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let piv = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r
    }
    ;[M[col], M[piv]] = [M[piv], M[col]]
    const p = M[col][col]
    if (Math.abs(p) < 1e-12) continue
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col] / p
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c]
    }
  }
  return M.map((row, i) => (Math.abs(row[i]) < 1e-12 ? 0 : row[n] / row[i]))
}

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export const euclidean = (a: [number, number], b: [number, number]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1])
