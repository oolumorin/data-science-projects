import { ConceptCard } from '../components/ConceptCard'
import { ModuleIntro, ModuleLayout } from '../components/ModuleLayout'
import { Quiz } from '../components/Quiz'
import { moduleById } from '../lib/modules'
import { methodologyQuiz } from '../data/quizzes/methodology'
import { MethodologyLoop } from '../viz/MethodologyLoop'
import { ApproachMatcher } from '../viz/ApproachMatcher'

const mod = moduleById('methodology')!

const SECTIONS = [
  { id: 'loop', label: 'The 10-stage loop' },
  { id: 'approach', label: 'Question → approach' },
  { id: 'quiz', label: 'Quiz' },
]

export default function Module1Methodology() {
  return (
    <ModuleLayout module={mod} sections={SECTIONS}>
      <ModuleIntro module={mod}>
        John Rollins’ 10-stage methodology is the spine of the whole certificate — and of this
        app. Every later module lives inside one of these stages. Click around the loop; notice
        how often the arrows point <em>backwards</em>.
      </ModuleIntro>

      <ConceptCard id="loop" title="The methodology is a loop, not a pipeline" viz={<MethodologyLoop />}>
        <p>
          Ten stages, from <strong>Business Understanding</strong> to <strong>Feedback</strong>.
          Click any stage to see its key question and outputs. The dashed arcs are the famous
          loop-backs: data that fails inspection sends you back to collection; a model that
          fails evaluation sends you back to modeling — or all the way back to rethinking the
          approach. Feedback from production closes the outer loop into stage 1.
        </p>
      </ConceptCard>

      <ConceptCard
        id="approach"
        title="Matching questions to analytic approaches"
        viz={<ApproachMatcher />}
      >
        <p>
          The Analytic Approach stage turns a business question into a model family.{' '}
          <strong>Descriptive</strong> asks what is happening (summaries, clustering);{' '}
          <strong>diagnostic</strong> asks why; <strong>predictive</strong> asks what will happen
          (regression, classification); <strong>prescriptive</strong> asks what to do about it.
          Match each scenario — this is the exact skill the rest of the modules build on.
        </p>
      </ConceptCard>

      <ConceptCard id="quiz" title="Check yourself">
        <Quiz moduleId="methodology" questions={methodologyQuiz} />
      </ConceptCard>
    </ModuleLayout>
  )
}
