import { ModuleIntro, ModuleLayout } from '../components/ModuleLayout'
import { moduleById } from '../lib/modules'

const mod = moduleById('python')!

export default function Module2Python() {
  return (
    <ModuleLayout module={mod} sections={[]}>
      <ModuleIntro module={mod}>Coming soon — this module is being built.</ModuleIntro>
    </ModuleLayout>
  )
}
