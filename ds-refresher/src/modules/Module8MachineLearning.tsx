import { ModuleIntro, ModuleLayout } from '../components/ModuleLayout'
import { moduleById } from '../lib/modules'

const mod = moduleById('ml')!

export default function Module8MachineLearning() {
  return (
    <ModuleLayout module={mod} sections={[]}>
      <ModuleIntro module={mod}>Coming soon — this module is being built.</ModuleIntro>
    </ModuleLayout>
  )
}
