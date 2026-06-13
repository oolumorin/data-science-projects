import { ConceptCard } from '../components/ConceptCard'
import { CodeSnippet } from '../components/CodeSnippet'
import { ModuleIntro, ModuleLayout } from '../components/ModuleLayout'
import { Quiz } from '../components/Quiz'
import { moduleById } from '../lib/modules'
import { datavizQuiz } from '../data/quizzes/dataviz'
import { FigureAnatomy } from '../viz/FigureAnatomy'
import { ChartChooser } from '../viz/ChartChooser'
import { SameDataFiveCharts } from '../viz/SameDataFiveCharts'
import { WaffleWordCloud } from '../viz/WaffleWordCloud'
import { MockChoroplethMap } from '../viz/MockChoroplethMap'

const mod = moduleById('dataviz')!

const SECTIONS = [
  { id: 'anatomy', label: 'Figure anatomy' },
  { id: 'chooser', label: 'Chart chooser' },
  { id: 'five-charts', label: 'Same data, 5 charts' },
  { id: 'waffle-wordcloud', label: 'Waffle & word cloud' },
  { id: 'maps', label: 'Seaborn & maps' },
  { id: 'quiz', label: 'Quiz' },
]

export default function Module7DataViz() {
  return (
    <ModuleLayout module={mod} sections={SECTIONS}>
      <ModuleIntro module={mod}>
        A chart is a claim about the data — and the wrong chart can make an honest dataset look
        dishonest. This module covers matplotlib's anatomy, how to pick the right chart type,
        and the classic ways charts mislead.
      </ModuleIntro>

      <ConceptCard
        id="anatomy"
        title="Anatomy of a matplotlib figure"
        viz={<FigureAnatomy />}
      >
        <p>
          Every matplotlib plot is built from the same parts: a <strong>Figure</strong> (the
          canvas) containing one or more <strong>Axes</strong> (plotting areas), which hold{' '}
          <strong>Artists</strong> — lines, markers, text, spines, ticks, gridlines, and a
          legend. Hover or tab through the figure below to see each part highlighted alongside
          the object-oriented code that controls it.
        </p>
        <CodeSnippet
          lang="python"
          title="pyplot vs object-oriented interface"
          code={`
import matplotlib.pyplot as plt

# pyplot interface — implicit "current" axes
plt.plot(x, y, marker='o')
plt.title('Revenue by quarter')
plt.xlabel('Quarter')
plt.show()

# object-oriented interface — explicit fig/ax
fig, ax = plt.subplots()
ax.plot(x, y, marker='o', label='Revenue')
ax.set_title('Revenue by quarter')
ax.set_xlabel('Quarter')
ax.set_ylabel('Revenue ($M)')
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.grid(True, alpha=0.3)
ax.legend(loc='upper left')
fig.savefig('revenue.png')
          `}
        />
      </ConceptCard>

      <ConceptCard
        id="chooser"
        title="Choosing the right chart"
        viz={<ChartChooser />}
      >
        <p>
          Chart selection starts with one question: <em>what relationship are you showing?</em>{' '}
          Comparison, distribution, relationship, composition, or trend each point toward a
          different chart family — and each has a common anti-pattern. Click through the
          flowchart; the breadcrumb above tracks your path, and "restart" resets it.
        </p>
      </ConceptCard>

      <ConceptCard
        id="five-charts"
        title="Same data, five charts"
        viz={<SameDataFiveCharts />}
      >
        <p>
          One small dataset — five months of sales — rendered as a line, bar, box plot,
          scatter, and pie. The line and bar charts are honest fits for a small ordered
          sequence; the scatter loses the time ordering; the box plot collapses the trend into
          one summary; and the pie chart treats months as "parts of a whole," which they
          aren't. Same numbers, very different (and not equally truthful) stories.
        </p>
      </ConceptCard>

      <ConceptCard
        id="waffle-wordcloud"
        title="Waffle charts & word clouds"
        viz={<WaffleWordCloud />}
      >
        <p>
          Two chart types from the 2019 syllabus that show up less often but are good to
          recognize. A <strong>waffle chart</strong> divides a grid (often 10×10) into
          proportional cells — useful for part-to-whole comparisons where exact percentages
          matter more than a pie's angles allow. A <strong>word cloud</strong> sizes words by
          frequency — quick for spotting dominant terms in text data, but not for precise
          comparison.
        </p>
        <CodeSnippet
          lang="python"
          title="Waffle chart and word cloud"
          code={`
from pywaffle import Waffle
import matplotlib.pyplot as plt

fig = plt.figure(
    FigureClass=Waffle,
    rows=10, columns=10,
    values={'Mobile': 58, 'Desktop': 32, 'Tablet': 10},
    legend={'loc': 'upper left', 'bbox_to_anchor': (1, 1)},
)
plt.show()

from wordcloud import WordCloud

text = ' '.join(df['review_text'])
wc = WordCloud(background_color='white', max_words=100).generate(text)
plt.imshow(wc, interpolation='bilinear')
plt.axis('off')
          `}
        />
      </ConceptCard>

      <ConceptCard
        id="maps"
        title="Seaborn regression plots & Folium choropleths"
        viz={<MockChoroplethMap />}
      >
        <p>
          Seaborn's <code>regplot</code> overlays a fitted regression line and confidence band
          on a scatter plot in one call — useful for a quick "is there a linear relationship
          here?" check before formal modeling. Folium builds interactive Leaflet maps in
          Python; a <strong>choropleth</strong> shades geographic regions by a data value,
          joining a DataFrame column to GeoJSON boundaries. The mock map above shows the idea —
          five regions shaded by a sequential color scale, exactly like a real Folium
          choropleth legend.
        </p>
        <CodeSnippet
          lang="python"
          title="sns.regplot and folium.Choropleth"
          code={`
import seaborn as sns
sns.regplot(x='engine_size', y='price', data=df)

import folium

m = folium.Map(location=[43.7, -79.4], zoom_start=10)
folium.Choropleth(
    geo_data=geojson_data,
    data=df,
    columns=['Neighbourhood', 'AvgPrice'],
    key_on='feature.properties.name',
    fill_color='YlOrRd',
    fill_opacity=0.7,
    line_opacity=0.3,
    legend_name='Average price ($)',
).add_to(m)
          `}
        />
      </ConceptCard>

      <ConceptCard id="quiz" title="Check yourself">
        <Quiz moduleId="dataviz" questions={datavizQuiz} />
      </ConceptCard>
    </ModuleLayout>
  )
}
