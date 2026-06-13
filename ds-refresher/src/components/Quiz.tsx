import { useState } from 'react'
import type { QuizQuestion } from '../data/quizzes/types'
import { useProgress, PASS_THRESHOLD } from '../hooks/useProgress'
import { shuffle } from '../lib/random'

interface ShuffledQuestion {
  q: QuizQuestion
  options: { text: string; originalIndex: number }[]
}

function buildAttempt(questions: QuizQuestion[]): ShuffledQuestion[] {
  return shuffle(questions).map((q) => ({
    q,
    options: shuffle(q.options.map((text, originalIndex) => ({ text, originalIndex }))),
  }))
}

interface AnswerRecord {
  /** index into the shuffled options */
  picked: number
  correct: boolean
}

export function Quiz({ moduleId, questions }: { moduleId: string; questions: QuizQuestion[] }) {
  const { recordQuizScore, moduleProgress } = useProgress()
  const [attempt, setAttempt] = useState(() => buildAttempt(questions))

  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const [scoreRecorded, setScoreRecorded] = useState(false)

  const prog = moduleProgress(moduleId)
  const sq = attempt[current]
  const numCorrect = answers.filter((a) => a.correct).length

  const retake = () => {
    setAttempt(buildAttempt(questions))
    setCurrent(0)
    setAnswers([])
    setPicked(null)
    setFinished(false)
    setScoreRecorded(false)
  }

  const pick = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    const correct = sq.options[i].originalIndex === sq.q.correctIndex
    setAnswers((a) => [...a, { picked: i, correct }])
  }

  const next = () => {
    if (current + 1 >= attempt.length) {
      setFinished(true)
      if (!scoreRecorded) {
        const finalCorrect = answers.filter((a) => a.correct).length
        recordQuizScore(moduleId, finalCorrect / attempt.length)
        setScoreRecorded(true)
      }
    } else {
      setCurrent((c) => c + 1)
      setPicked(null)
    }
  }

  if (finished) {
    const score = numCorrect / attempt.length
    const passed = score >= PASS_THRESHOLD
    return (
      <div className="rounded-xl border border-ink-700 bg-ink-900 p-6">
        <h3 className="text-lg font-semibold">Quiz complete</h3>
        <p className="mt-2 text-3xl font-bold">
          <span className={passed ? 'text-good' : 'text-warn'}>
            {numCorrect}/{attempt.length}
          </span>{' '}
          <span className="text-base font-normal text-ink-400">
            ({Math.round(score * 100)}%) {passed ? '— passed ✓' : `— aim for ≥${PASS_THRESHOLD * 100}%`}
          </span>
        </p>
        {prog.bestScore !== undefined && (
          <p className="mt-1 text-sm text-ink-400">
            Best score: {Math.round(prog.bestScore * 100)}% · {prog.attempts} attempt
            {prog.attempts === 1 ? '' : 's'}
          </p>
        )}
        <div className="mt-5 space-y-3">
          {attempt.map((s, i) => {
            const a = answers[i]
            return (
              <div key={s.q.id} className="rounded-lg border border-ink-800 p-3">
                <p className="text-sm">
                  <span className={a.correct ? 'text-good' : 'text-bad'}>
                    {a.correct ? '✓' : '✗'}
                  </span>{' '}
                  {s.q.prompt}
                </p>
                {!a.correct && (
                  <p className="mt-1 text-xs text-ink-400">
                    You picked “{s.options[a.picked].text}” · correct: “
                    {s.q.options[s.q.correctIndex]}”
                  </p>
                )}
                <p className="mt-1 text-xs leading-relaxed text-ink-300">{s.q.explanation}</p>
              </div>
            )
          })}
        </div>
        <button
          onClick={retake}
          className="accent-text mt-5 rounded-md border border-ink-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-ink-800"
        >
          Retake quiz ↻
        </button>
      </div>
    )
  }

  const answered = picked !== null
  const correctPick = answered && sq.options[picked].originalIndex === sq.q.correctIndex

  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs text-ink-400">
          Question {current + 1} of {attempt.length}
        </span>
        <span className="font-mono text-xs text-ink-400">
          {numCorrect} correct so far
        </span>
      </div>
      <p className="text-[15px] font-medium leading-relaxed">{sq.q.prompt}</p>
      <div className="mt-4 space-y-2">
        {sq.options.map((opt, i) => {
          let style = 'border-ink-700 hover:border-ink-500'
          if (answered) {
            if (opt.originalIndex === sq.q.correctIndex) {
              style = 'border-good bg-good/10'
            } else if (i === picked) {
              style = 'border-bad bg-bad/10'
            } else {
              style = 'border-ink-800 opacity-60'
            }
          }
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={answered}
              className={`block w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${style}`}
            >
              <span className="mr-2 font-mono text-xs text-ink-400">
                {String.fromCharCode(65 + i)}
              </span>
              {opt.text}
            </button>
          )
        })}
      </div>
      {answered && (
        <div
          className={`mt-4 rounded-lg border p-3 text-sm leading-relaxed ${
            correctPick ? 'border-good/40 bg-good/5' : 'border-bad/40 bg-bad/5'
          }`}
        >
          <p className="font-medium">{correctPick ? 'Correct ✓' : 'Not quite ✗'}</p>
          <p className="mt-1 text-ink-300">{sq.q.explanation}</p>
          <button
            onClick={next}
            className="accent-text mt-3 rounded-md border border-ink-600 px-4 py-1.5 text-sm transition-colors hover:bg-ink-800"
          >
            {current + 1 >= attempt.length ? 'See results →' : 'Next question →'}
          </button>
        </div>
      )}
    </div>
  )
}
