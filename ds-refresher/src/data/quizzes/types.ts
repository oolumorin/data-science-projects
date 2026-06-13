export interface QuizQuestion {
  id: string
  prompt: string
  /** exactly 4 options */
  options: string[]
  /** index into `options` of the correct answer (pre-shuffle) */
  correctIndex: number
  /** 1–3 sentence explanation shown after answering — mandatory */
  explanation: string
}
