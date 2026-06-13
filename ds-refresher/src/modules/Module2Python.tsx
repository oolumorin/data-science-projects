import { ConceptCard } from '../components/ConceptCard'
import { CodeSnippet } from '../components/CodeSnippet'
import { ModuleIntro, ModuleLayout } from '../components/ModuleLayout'
import { Quiz } from '../components/Quiz'
import { moduleById } from '../lib/modules'
import { pythonQuiz } from '../data/quizzes/python'
import { BroadcastingViz } from '../viz/BroadcastingViz'
import { DataFrameAnatomy } from '../viz/DataFrameAnatomy'
import { GroupbyPlayer } from '../viz/GroupbyPlayer'
import { MergeLab } from '../viz/MergeLab'

const mod = moduleById('python')!

const SECTIONS = [
  { id: 'broadcasting', label: 'Broadcasting' },
  { id: 'anatomy', label: 'DataFrame anatomy' },
  { id: 'selection', label: 'loc vs iloc' },
  { id: 'groupby', label: 'Split-apply-combine' },
  { id: 'merge', label: 'Merging tables' },
  { id: 'reading', label: 'Reading data' },
  { id: 'quiz', label: 'Quiz' },
]

const LOC_ILOC_CODE = `
# loc: label-based            iloc: position-based
df.loc[0, 'price']            df.iloc[0, 1]
df.loc[0:2, 'city']           df.iloc[0:3, 0]
df.loc[df.price > 400]        df.iloc[[0, 2, 4]]
`.trim()

const READ_DATA_CODE = `
import pandas as pd
import requests

# from a local file
df_csv = pd.read_csv('listings.csv')
df_json = pd.read_json('listings.json')

# from a web API
resp = requests.get('https://api.example.com/listings')
df_api = pd.DataFrame(resp.json()['results'])
`.trim()

export default function Module2Python() {
  return (
    <ModuleLayout module={mod} sections={SECTIONS}>
      <ModuleIntro module={mod}>
        You write Python daily — this module is a fast pass over the mental models that are
        specific to <em>data science</em> Python: how NumPy stretches arrays to fit operations,
        how a DataFrame is actually shaped, and the split-apply-combine pattern that underlies
        almost every aggregation you'll write.
      </ModuleIntro>

      <ConceptCard
        id="broadcasting"
        title="Broadcasting: how NumPy fits mismatched shapes together"
        viz={<BroadcastingViz />}
        code={
          <CodeSnippet
            lang="python"
            title="broadcasting.py"
            code={`
import numpy as np

a = np.ones((3, 4))
b = np.array([1, 2, 3, 4])   # shape (4,)
a + b                         # broadcasts to (3, 4)

c = np.ones((2, 3))
d = np.ones((3, 2))
c + d                         # ValueError: not broadcastable
`}
          />
        }
      >
        <p>
          Two shapes are compatible if, comparing dimensions from the <strong>right</strong>, every
          pair is either equal or one of them is 1. Size-1 dimensions are conceptually
          "stretched" to match — no data is copied, but the math behaves as if it were. Pick a
          shape pair above; the ghost cells show the stretch, or the panel explains exactly which
          dimension pair breaks the rule.
        </p>
      </ConceptCard>

      <ConceptCard id="anatomy" title="A DataFrame has four moving parts" viz={<DataFrameAnatomy />}>
        <p>
          Every DataFrame is really four things glued together: the <strong>index</strong> (row
          labels), the <strong>columns</strong> (field names), the <strong>values</strong> (the
          actual 2D data grid), and a per-column <strong>dtype</strong>. Operations like
          <code> .reset_index()</code>, <code> .set_index()</code>, and <code> .astype()</code>{' '}
          each target exactly one of these four parts. Hover the diagram to see them separately.
        </p>
      </ConceptCard>

      <ConceptCard
        id="selection"
        title=".loc vs .iloc"
        code={<CodeSnippet lang="python" title="selection.py" code={LOC_ILOC_CODE} defaultOpen />}
      >
        <p>
          <code>.loc</code> selects by <strong>label</strong> — index values and column names,
          including boolean masks. <code>.iloc</code> selects by <strong>integer position</strong>,
          like list indexing, regardless of what the labels actually are. The two look similar on a
          default 0..n index, but diverge the moment you filter, sort, or set a custom index — a
          sorted/filtered DataFrame keeps its original labels, so <code>.iloc[0]</code> and{' '}
          <code>.loc[0]</code> can return different rows.
        </p>
      </ConceptCard>

      <ConceptCard
        id="groupby"
        title="groupby is split → apply → combine"
        viz={<GroupbyPlayer />}
        code={
          <CodeSnippet
            lang="python"
            title="groupby.py"
            code={`df.groupby('city')['price'].mean()`}
          />
        }
      >
        <p>
          <code>groupby</code> never computes anything by itself — it just describes how to{' '}
          <strong>split</strong> rows into groups. The aggregation you chain on (<code>.mean()</code>
          , <code>.sum()</code>, <code>.count()</code>...) is the <strong>apply</strong> step, run
          independently per group. Pandas then <strong>combines</strong> the per-group results into
          one output, indexed by the group key. Step through the player to watch all three phases.
        </p>
      </ConceptCard>

      <ConceptCard
        id="merge"
        title="Merging tables on a key"
        viz={<MergeLab />}
        code={
          <CodeSnippet
            lang="python"
            title="merge.py"
            code={`pd.merge(employees, departments, on='dept_id', how='left')`}
          />
        }
      >
        <p>
          <code>pd.merge</code> joins two DataFrames on a shared key column, mirroring SQL joins.{' '}
          <code>how='inner'</code> keeps only matching keys; <code>'left'</code>/<code>'right'</code>{' '}
          keep all rows from one side, filling unmatched columns with <code>NaN</code>;{' '}
          <code>'outer'</code> keeps everything from both. Switch the control above and watch
          matching keys light up across both tables and the row count change.
        </p>
      </ConceptCard>

      <ConceptCard
        id="reading"
        title="Getting data in"
        code={<CodeSnippet lang="python" title="reading.py" code={READ_DATA_CODE} defaultOpen />}
      >
        <p>
          Three on-ramps cover most cases: <code>pd.read_csv</code> and <code>pd.read_json</code>{' '}
          parse local or remote files directly into a DataFrame. For arbitrary web APIs,{' '}
          <code>requests.get(url).json()</code> gives you a Python dict/list, which{' '}
          <code>pd.DataFrame(...)</code> converts into a table — usually after picking out the
          relevant key (e.g. <code>['results']</code>) from the response envelope.
        </p>
      </ConceptCard>

      <ConceptCard id="quiz" title="Check yourself">
        <Quiz moduleId="python" questions={pythonQuiz} />
      </ConceptCard>
    </ModuleLayout>
  )
}
