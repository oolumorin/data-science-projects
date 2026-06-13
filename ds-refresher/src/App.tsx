import { Suspense, lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { ProgressProvider } from './hooks/ProgressProvider'
import { Dashboard } from './pages/Dashboard'

// one lazy chunk per module keeps the initial load light
const Module1 = lazy(() => import('./modules/Module1Methodology'))
const Module2 = lazy(() => import('./modules/Module2Python'))
const Module3 = lazy(() => import('./modules/Module3Sql'))
const Module4 = lazy(() => import('./modules/Module4Wrangling'))
const Module5 = lazy(() => import('./modules/Module5Eda'))
const Module6 = lazy(() => import('./modules/Module6Regression'))
const Module7 = lazy(() => import('./modules/Module7DataViz'))
const Module8 = lazy(() => import('./modules/Module8MachineLearning'))

function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center font-mono text-sm text-ink-400">
      loading module…
    </div>
  )
}

export default function App() {
  return (
    <ProgressProvider>
      <HashRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/module/methodology" element={<Module1 />} />
            <Route path="/module/python" element={<Module2 />} />
            <Route path="/module/sql" element={<Module3 />} />
            <Route path="/module/wrangling" element={<Module4 />} />
            <Route path="/module/eda" element={<Module5 />} />
            <Route path="/module/regression" element={<Module6 />} />
            <Route path="/module/dataviz" element={<Module7 />} />
            <Route path="/module/ml" element={<Module8 />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </ProgressProvider>
  )
}
