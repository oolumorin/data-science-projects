import type { QuizQuestion } from './types'

export const datavizQuiz: QuizQuestion[] = [
  {
    id: 'm7-q1',
    prompt: 'In matplotlib, what is the relationship between a Figure and an Axes?',
    options: [
      'A Figure is the overall canvas; an Axes is one plotting area (subplot) within it',
      'They are interchangeable names for the same object',
      'An Axes can contain multiple Figures',
      'A Figure can only ever contain exactly one Axes',
    ],
    correctIndex: 0,
    explanation:
      'The Figure is the outer container — it can hold one or more Axes, each of which is an individual plot with its own ticks, labels, and artists.',
  },
  {
    id: 'm7-q2',
    prompt: 'What is the key difference between the pyplot interface (plt.plot(...)) and the object-oriented interface (ax.plot(...))?',
    options: [
      'pyplot implicitly tracks a "current" figure/axes, while the OO interface operates explicitly on Figure/Axes objects you hold references to',
      'pyplot can only create bar charts; the OO interface is for line charts only',
      'The OO interface does not support legends or titles',
      'pyplot is only available in Jupyter notebooks',
    ],
    correctIndex: 0,
    explanation:
      'plt.plot() is a convenience wrapper that operates on an implicit current Axes. The OO interface (fig, ax = plt.subplots(); ax.plot(...)) is more explicit and scales better to multi-panel figures.',
  },
  {
    id: 'm7-q3',
    prompt: 'Which matplotlib call sets the visibility or position of the box lines around a plot?',
    options: ['ax.spines[...]', 'ax.set_title(...)', 'ax.legend(...)', 'fig.suptitle(...)'],
    correctIndex: 0,
    explanation:
      'Spines are the Axes border lines (left, right, top, bottom). ax.spines["top"].set_visible(False) is a common way to "clean up" a plot.',
  },
  {
    id: 'm7-q4',
    prompt: 'A bar chart whose y-axis starts at 80 instead of 0, making a difference of 2 units look huge, is an example of:',
    options: [
      'A truncated axis — a common way to mislead viewers about the magnitude of a difference',
      'A correct and recommended default for all bar charts',
      'A histogram',
      'A choropleth map',
    ],
    correctIndex: 0,
    explanation:
      'Truncating the y-axis on a bar chart exaggerates visual differences because bar length no longer encodes value proportionally from zero — a classic honesty pitfall.',
  },
  {
    id: 'm7-q5',
    prompt: 'Why is a pie chart with 12 slices generally considered a poor choice?',
    options: [
      'Human perception of angles and areas is imprecise, so many similarly-sized slices become impossible to compare accurately',
      'Pie charts cannot be rendered in matplotlib',
      'Pie charts always require exactly 3 categories',
      'Pie charts can only show percentages that sum to less than 50%',
    ],
    correctIndex: 0,
    explanation:
      'Beyond roughly 5 slices, distinguishing relative sizes by angle/area becomes very hard — a sorted bar chart communicates the same part-to-whole comparison more accurately.',
  },
  {
    id: 'm7-q6',
    prompt: 'For showing how five monthly sales totals changed over time, which chart is most appropriate?',
    options: [
      'A line chart, since it directly encodes an ordered sequence and trend',
      'A pie chart, since each month is a "slice" of the year',
      'A box plot, since it summarizes all months into one distribution',
      'A scatter plot with months in random order',
    ],
    correctIndex: 0,
    explanation:
      'A line chart preserves the temporal order and makes the trend (up, down, accelerating) immediately visible — exactly what a pie or box plot would obscure.',
  },
  {
    id: 'm7-q7',
    prompt: 'What does a waffle chart (10x10 grid of squares) make easier to read than a pie chart?',
    options: [
      'Exact percentages, because each square represents one discrete unit (1%)',
      'Trends over time',
      'Correlation between two variables',
      'The exact numeric value of outliers',
    ],
    correctIndex: 0,
    explanation:
      'Because each cell is a fixed unit (e.g., 1 out of 100), counting cells gives a more precise read of proportions than judging pie-slice angles.',
  },
  {
    id: 'm7-q8',
    prompt: 'In a word cloud, what does font size typically encode, and what is its main limitation?',
    options: [
      'Word frequency or importance — but it does not support precise quantitative comparison between words',
      'Alphabetical order — words are sized by their position in the alphabet',
      'The exact numeric value with no ambiguity',
      'Word clouds encode only color, never size',
    ],
    correctIndex: 0,
    explanation:
      'Larger words appear more frequent/important, giving a quick qualitative impression, but reading exact relative frequencies from font size is unreliable.',
  },
  {
    id: 'm7-q9',
    prompt: 'What does sns.regplot(x=..., y=..., data=df) draw by default?',
    options: [
      'A scatter plot of the two variables plus a fitted linear regression line with a confidence interval band',
      'A bar chart of the mean of y for each unique x',
      'A heatmap of the correlation matrix',
      'A pie chart split by the sign of the residuals',
    ],
    correctIndex: 0,
    explanation:
      'seaborn\'s regplot combines a scatter plot with an OLS regression fit line and a shaded confidence interval, making the linear relationship and its uncertainty visible at a glance.',
  },
  {
    id: 'm7-q10',
    prompt: 'In a Folium choropleth map, what determines the fill color of each region?',
    options: [
      'A numeric value per region (e.g., from a DataFrame), mapped through a color scale and joined to the map\'s GeoJSON boundaries',
      'The alphabetical order of the region names',
      'A random color assigned at map creation',
      'The latitude of the region\'s centroid only',
    ],
    correctIndex: 0,
    explanation:
      'folium.Choropleth joins a data column (keyed by region identifier) to GeoJSON polygon boundaries and applies a color scale (e.g., a sequential colormap) based on each region\'s value.',
  },
]
