import { ConceptCard } from '../components/ConceptCard'
import { ModuleIntro, ModuleLayout } from '../components/ModuleLayout'
import { Quiz } from '../components/Quiz'
import { CodeSnippet } from '../components/CodeSnippet'
import { moduleById } from '../lib/modules'
import { edaQuiz } from '../data/quizzes/eda'
import { PearsonPlayground } from '../viz/PearsonPlayground'
import { AnscombeQuartet } from '../viz/AnscombeQuartet'
import { AnovaIntuition } from '../viz/AnovaIntuition'
import { BoxplotAnatomy } from '../viz/BoxplotAnatomy'

const mod = moduleById('eda')!

const SECTIONS = [
  { id: 'descriptive', label: 'Descriptive stats' },
  { id: 'anscombe', label: "Anscombe's lesson" },
  { id: 'pearson', label: 'Pearson r' },
  { id: 'anova', label: 'ANOVA' },
  { id: 'boxplot', label: 'Boxplot anatomy' },
  { id: 'quiz', label: 'Quiz' },
]

export default function Module5Eda() {
  return (
    <ModuleLayout module={mod} sections={SECTIONS}>
      <ModuleIntro module={mod}>
        Exploratory data analysis is where you build intuition before modeling: what does each
        column look like, how do columns relate, and which differences are real versus noise?
        This module covers the everyday describe/groupby toolkit, the visualization-first mindset
        Anscombe's Quartet makes unforgettable, and the core statistical tests — correlation,
        ANOVA — that quantify what your eyes suspect.
      </ModuleIntro>

      <ConceptCard id="descriptive" title="Descriptive stats, value_counts, groupby">
        <p>
          Before any modeling, get a feel for each column. <code>df.describe()</code> gives count,
          mean, std, and quartiles for numeric columns in one call.{' '}
          <code>df['col'].value_counts()</code> is the categorical equivalent — frequency of each
          category, sorted descending.{' '}
          <code>groupby</code> + aggregation (or <code>pivot_table</code>) lets you compare a
          metric across categories, e.g. average price by fuel type. These three calls answer
          "what does my data look like?" faster than almost anything else.
        </p>
        <CodeSnippet
          lang="python"
          title="the everyday toolkit"
          code={`
df.describe()
df['fuel'].value_counts()

# average price per fuel type
df.groupby('fuel')['price'].mean()

# pivot table: mean price by fuel x drive-wheels
df.pivot_table(values='price', index='fuel', columns='drive-wheels', aggfunc='mean')
`}
        />
      </ConceptCard>

      <ConceptCard
        id="anscombe"
        title="Anscombe's Quartet: always plot it"
        viz={<AnscombeQuartet />}
      >
        <p>
          Francis Anscombe constructed four datasets in 1973 that share (almost) identical mean,
          variance, correlation, and regression line — but look completely different when
          plotted. Reveal them one at a time: a clean linear relationship, a curve that linear
          regression misses, a relationship dominated by one outlier, and a near-vertical cluster
          plus one extreme point. The stats panel never changes. The lesson: summary statistics
          are necessary but never sufficient — visualize before you trust them.
        </p>
        <CodeSnippet
          lang="python"
          title="same stats, different plots"
          code={`
for name, d in datasets.items():
    print(name, d['x'].mean(), d['y'].mean(), d['x'].corr(d['y']))
    # nearly identical numbers for all four...

# ...but the plots tell a very different story
fig, axes = plt.subplots(2, 2)
for ax, (name, d) in zip(axes.flat, datasets.items()):
    ax.scatter(d['x'], d['y'])
`}
        />
      </ConceptCard>

      <ConceptCard
        id="pearson"
        title="Pearson correlation: what r does and doesn't capture"
        viz={<PearsonPlayground />}
      >
        <p>
          Pearson's <em>r</em> ranges from −1 (perfect negative linear relationship) to +1
          (perfect positive), with 0 meaning no linear relationship. Drag the slider to set a
          target correlation and watch the cloud reshape, with the sample r tracking it. Critically,
          r only measures <strong>linear</strong> association — click "show a nonlinear trap" to see
          a perfect parabola (y = x²) score r ≈ 0. And remember: correlation, however strong,
          never proves causation — a confounder can drive both variables.
        </p>
        <CodeSnippet
          lang="python"
          title="pearsonr and df.corr()"
          code={`
from scipy.stats import pearsonr

r, p_value = pearsonr(df['horsepower'], df['price'])
# r: strength/direction of linear relationship
# p_value: could this r arise by chance if truly uncorrelated?

df.corr(numeric_only=True)  # full correlation matrix
`}
        />
      </ConceptCard>

      <ConceptCard
        id="anova"
        title="ANOVA: are these groups actually different?"
        viz={<AnovaIntuition />}
      >
        <p>
          ANOVA compares variation <em>between</em> group means to variation <em>within</em> each
          group. Drag any group's mean (arrow keys also work) and watch the F-statistic respond:
          F = MS<sub>between</sub> / MS<sub>within</sub>. When group means are close relative to
          their spread, F stays near 1 — "can't distinguish from noise." Pull the means apart
          relative to the spread and F climbs — "groups likely differ." This is the same logic
          behind the verdict a p-value gives you, made visual.
        </p>
        <CodeSnippet
          lang="python"
          title="scipy.stats.f_oneway"
          code={`
from scipy.stats import f_oneway

g1 = df.loc[df['drive-wheels'] == 'fwd', 'price']
g2 = df.loc[df['drive-wheels'] == 'rwd', 'price']
g3 = df.loc[df['drive-wheels'] == '4wd', 'price']

f_stat, p_value = f_oneway(g1, g2, g3)
# large F + small p -> at least one group mean differs
`}
        />
      </ConceptCard>

      <ConceptCard
        id="boxplot"
        title="Boxplot anatomy"
        viz={<BoxplotAnatomy />}
      >
        <p>
          A boxplot summarizes a distribution in five numbers: minimum (within range), Q1,
          median, Q3, and maximum (within range), plus flagged outliers. Hover or focus each part
          above the dot strip — the median line, the IQR box (Q1 to Q3), the whiskers, and the
          outlier circles — to see exactly which underlying points each part represents and how
          the 1.5×IQR rule decides what counts as an outlier.
        </p>
        <CodeSnippet
          lang="python"
          title="boxplot + chi-square aside"
          code={`
df.boxplot(column='price', by='fuel')

# chi-square: are two categorical columns associated?
from scipy.stats import chi2_contingency
table = pd.crosstab(df['fuel'], df['drive-wheels'])
chi2, p_value, dof, expected = chi2_contingency(table)
`}
        />
      </ConceptCard>

      <ConceptCard id="quiz" title="Check yourself">
        <Quiz moduleId="eda" questions={edaQuiz} />
      </ConceptCard>
    </ModuleLayout>
  )
}
