import { useMemo, useState } from 'react'
import { VizPanel } from '../components/ConceptCard'
import { SegmentedControl } from '../components/VizSlider'

interface Employee {
  emp_id: number
  name: string
  dept_id: number
}

interface Department {
  dept_id: number
  dept_name: string
}

const EMPLOYEES: Employee[] = [
  { emp_id: 1, name: 'Asha', dept_id: 10 },
  { emp_id: 2, name: 'Ben', dept_id: 20 },
  { emp_id: 3, name: 'Cy', dept_id: 10 },
  { emp_id: 4, name: 'Dee', dept_id: 40 },
]

const DEPARTMENTS: Department[] = [
  { dept_id: 10, dept_name: 'Engineering' },
  { dept_id: 20, dept_name: 'Sales' },
  { dept_id: 30, dept_name: 'Marketing' },
]

type How = 'inner' | 'left' | 'right' | 'outer'

interface ResultRow {
  name: string | null
  dept_id: number | null
  dept_name: string | null
  empMatched: boolean
  deptMatched: boolean
}

function computeMerge(how: How): ResultRow[] {
  const rows: ResultRow[] = []
  const matchedDeptIds = new Set<number>()

  for (const e of EMPLOYEES) {
    const dept = DEPARTMENTS.find((d) => d.dept_id === e.dept_id)
    if (dept) {
      matchedDeptIds.add(dept.dept_id)
      rows.push({ name: e.name, dept_id: e.dept_id, dept_name: dept.dept_name, empMatched: true, deptMatched: true })
    } else if (how === 'left' || how === 'outer') {
      rows.push({ name: e.name, dept_id: e.dept_id, dept_name: null, empMatched: true, deptMatched: false })
    }
    // inner/right with no match: skip employee row entirely
  }

  if (how === 'right' || how === 'outer') {
    for (const d of DEPARTMENTS) {
      if (!matchedDeptIds.has(d.dept_id)) {
        rows.push({ name: null, dept_id: d.dept_id, dept_name: d.dept_name, empMatched: false, deptMatched: true })
      }
    }
  }

  return rows
}

const HOW_OPTIONS: { value: How; label: string }[] = [
  { value: 'inner', label: 'inner' },
  { value: 'left', label: 'left' },
  { value: 'right', label: 'right' },
  { value: 'outer', label: 'outer' },
]

function Cell({ children, na }: { children: React.ReactNode; na?: boolean }) {
  return (
    <td className={`border border-ink-700 px-2 py-1 font-mono text-xs ${na ? 'text-ink-600 italic' : 'text-ink-100'}`}>
      {na ? 'NaN' : children}
    </td>
  )
}

export function MergeLab() {
  const [how, setHow] = useState<How>('left')
  const [hoverDept, setHoverDept] = useState<number | null>(null)

  const result = useMemo(() => computeMerge(how), [how])

  const matchingDeptIds = useMemo(() => new Set(EMPLOYEES.map((e) => e.dept_id)), [])
  const matchingEmpDeptIds = useMemo(() => new Set(DEPARTMENTS.map((d) => d.dept_id)), [])

  return (
    <VizPanel
      controls={
        <SegmentedControl label="how=" value={how} onChange={setHow} options={HOW_OPTIONS} />
      }
      readout={
        <>
          <span>
            employees: <span className="accent-text">{EMPLOYEES.length}</span> · departments:{' '}
            <span className="accent-text">{DEPARTMENTS.length}</span>
          </span>
          <span>
            result rows: <span className="accent-text">{result.length}</span>
          </span>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 font-mono text-xs text-ink-400">employees (left)</p>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">name</th>
                <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">dept_id</th>
              </tr>
            </thead>
            <tbody>
              {EMPLOYEES.map((e) => {
                const matched = matchingEmpDeptIds.has(e.dept_id)
                return (
                  <tr key={e.emp_id} onMouseEnter={() => setHoverDept(e.dept_id)} onMouseLeave={() => setHoverDept(null)}>
                    <td className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-100">{e.name}</td>
                    <td
                      className={`border border-ink-700 px-2 py-1 font-mono text-xs transition-colors duration-300 ${
                        matched ? 'text-ink-100' : 'text-bad'
                      } ${hoverDept === e.dept_id ? 'bg-ink-700/60' : ''}`}
                    >
                      {e.dept_id}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div>
          <p className="mb-1 font-mono text-xs text-ink-400">departments (right)</p>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">dept_id</th>
                <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">dept_name</th>
              </tr>
            </thead>
            <tbody>
              {DEPARTMENTS.map((d) => {
                const matched = matchingDeptIds.has(d.dept_id)
                return (
                  <tr key={d.dept_id} onMouseEnter={() => setHoverDept(d.dept_id)} onMouseLeave={() => setHoverDept(null)}>
                    <td
                      className={`border border-ink-700 px-2 py-1 font-mono text-xs transition-colors duration-300 ${
                        matched ? 'text-ink-100' : 'text-bad'
                      } ${hoverDept === d.dept_id ? 'bg-ink-700/60' : ''}`}
                    >
                      {d.dept_id}
                    </td>
                    <td className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-100">{d.dept_name}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 mb-1 font-mono text-xs text-ink-400">
        result — pd.merge(employees, departments, on='dept_id', how='{how}')
      </p>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">name</th>
            <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">dept_id</th>
            <th className="border border-ink-700 px-2 py-1 font-mono text-xs text-ink-400">dept_name</th>
          </tr>
        </thead>
        <tbody>
          {result.length === 0 && (
            <tr>
              <td colSpan={3} className="border border-ink-700 px-2 py-1 text-center font-mono text-xs text-ink-600 italic">
                (empty)
              </td>
            </tr>
          )}
          {result.map((r, i) => (
            <tr key={i}>
              <Cell na={r.name === null}>{r.name}</Cell>
              <Cell na={r.dept_id === null}>{r.dept_id}</Cell>
              <Cell na={r.dept_name === null}>{r.dept_name}</Cell>
            </tr>
          ))}
        </tbody>
      </table>
    </VizPanel>
  )
}
