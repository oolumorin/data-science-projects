import { ConceptCard } from '../components/ConceptCard'
import { ModuleIntro, ModuleLayout } from '../components/ModuleLayout'
import { Quiz } from '../components/Quiz'
import { CodeSnippet } from '../components/CodeSnippet'
import { moduleById } from '../lib/modules'
import { wranglingQuiz } from '../data/quizzes/wrangling'
import { MissingDataFlowchart } from '../viz/MissingDataFlowchart'
import { ScalingLab } from '../viz/ScalingLab'
import { BinningSlider } from '../viz/BinningSlider'
import { OneHotViz } from '../viz/OneHotViz'

const mod = moduleById('wrangling')!

const SECTIONS = [
  { id: 'missing', label: 'Missing values' },
  { id: 'dtypes', label: 'Formatting & dtypes' },
  { id: 'scaling', label: 'Scaling' },
  { id: 'binning', label: 'Binning' },
  { id: 'onehot', label: 'One-hot encoding' },
  { id: 'quiz', label: 'Quiz' },
]

export default function Module4Wrangling() {
  return (
    <ModuleLayout module={mod} sections={SECTIONS}>
      <ModuleIntro module={mod}>
        Real data is messy: values are missing, types are wrong, and scales clash. Data
        wrangling — sometimes 60–80% of a project's time — turns raw tables into something a
        model can actually use. This module covers the decisions you'll make over and over:
        what to do with gaps, how to rescale numbers, and how to represent categories.
      </ModuleIntro>

      <ConceptCard
        id="missing"
        title="Missing values: drop, impute, or predict?"
        viz={<MissingDataFlowchart />}
      >
        <p>
          There's no single right answer for missing data — it depends on how much is missing
          and <em>why</em>. Click through the decision tree: is the column numeric? Is more than
          30% missing? Is the missingness random, or does it depend on other columns? Each path
          ends in a concrete recommendation with its rationale. Try a few different paths to see
          how the same dataset can call for different strategies column by column.
        </p>
        <CodeSnippet
          lang="python"
          title="dropna vs fillna"
          code={`
# drop rows with any missing value in this column
df_dropped = df.dropna(subset=['price'])

# impute with the column mean (numeric, missing-at-random)
df['price'] = df['price'].fillna(df['price'].mean())

# impute with the mode (categorical, missing-at-random)
df['fuel'] = df['fuel'].fillna(df['fuel'].mode()[0])
`}
        />
      </ConceptCard>

      <ConceptCard id="dtypes" title="Formatting and dtypes">
        <p>
          Data often arrives as text even when it represents numbers — "13500" as a string, or
          units baked into the value ("13500 USD"). pandas won't compute statistics on object
          columns the way it does on numeric ones, so the first wrangling step is usually
          converting columns to their correct dtype. <code>pd.to_numeric</code> with{' '}
          <code>errors='coerce'</code> turns unparseable entries into <code>NaN</code> instead of
          crashing, and <code>astype</code> lets you cast explicitly (e.g. to{' '}
          <code>category</code> for memory savings on repeated strings).
        </p>
        <CodeSnippet
          lang="python"
          title="fixing dtypes"
          code={`
# strings like "13500" -> float, invalid entries -> NaN
df['price'] = pd.to_numeric(df['price'], errors='coerce')

# explicit cast, e.g. to save memory on a repeated categorical
df['fuel'] = df['fuel'].astype('category')

df.dtypes
`}
        />
      </ConceptCard>

      <ConceptCard
        id="scaling"
        title="Normalization: simple scaling, min-max, z-score"
        viz={<ScalingLab />}
      >
        <p>
          Many models are sensitive to the scale of input features — a column ranging 5,000–45,000
          can dwarf one ranging 0–1. Toggle between scaling methods on this right-skewed
          distribution of car prices: <strong>simple scaling</strong> (x/max) keeps everything
          positive but doesn't anchor the minimum; <strong>min-max</strong> squeezes everything
          into [0, 1]; <strong>z-score</strong> recenters to mean 0, std 1. Watch the axis rescale
          and the summary stats update — the shape of the distribution doesn't change, only its
          scale.
        </p>
        <CodeSnippet
          lang="python"
          title="three ways to scale"
          code={`
# simple scaling
df['price_simple'] = df['price'] / df['price'].max()

# min-max scaling
df['price_minmax'] = (df['price'] - df['price'].min()) / (
    df['price'].max() - df['price'].min()
)

# z-score (standardization)
df['price_z'] = (df['price'] - df['price'].mean()) / df['price'].std()
`}
        />
      </ConceptCard>

      <ConceptCard
        id="binning"
        title="Binning continuous values"
        viz={<BinningSlider />}
      >
        <p>
          Binning groups a continuous variable into discrete buckets (e.g. "low / medium / high"
          price). It's useful for simplifying a feature, building histograms, or feeding
          categorical-only algorithms — but it always trades information for simplicity. Drag the
          slider from 3 to 20 bins on the same price data: too few bins hides structure, too many
          makes the histogram noisy with mostly-empty bars. The bin width readout shows exactly
          how coarse each bucket is.
        </p>
        <CodeSnippet
          lang="python"
          title="pd.cut for equal-width bins"
          code={`
bins = pd.cut(df['price'], bins=8)
df['price_binned'] = bins

# or with explicit labels
df['price_tier'] = pd.cut(
    df['price'],
    bins=[0, 15000, 30000, 50000],
    labels=['low', 'mid', 'high'],
)
`}
        />
      </ConceptCard>

      <ConceptCard
        id="onehot"
        title="One-hot encoding categorical variables"
        viz={<OneHotViz />}
      >
        <p>
          Models generally need numbers, not strings — but mapping categories to arbitrary
          integers (gas=0, diesel=1, electric=2) invents a false ordering. One-hot encoding instead
          creates one binary column per category: a row gets a 1 in the column matching its
          category and 0 everywhere else. Step through the animation to watch the single{' '}
          <code>fuel</code> column split into three <code>fuel_gas</code> /{' '}
          <code>fuel_diesel</code> / <code>fuel_electric</code> columns, one row at a time.
        </p>
        <CodeSnippet
          lang="python"
          title="pd.get_dummies"
          code={`
dummies = pd.get_dummies(df['fuel'], prefix='fuel')
df = pd.concat([df.drop(columns=['fuel']), dummies], axis=1)
`}
        />
      </ConceptCard>

      <ConceptCard id="quiz" title="Check yourself">
        <Quiz moduleId="wrangling" questions={wranglingQuiz} />
      </ConceptCard>
    </ModuleLayout>
  )
}
