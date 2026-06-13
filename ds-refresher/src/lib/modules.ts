/** Data-driven module registry — adding a 9th module later means adding one entry here. */
export interface ModuleMeta {
  id: string
  num: number
  title: string
  shortTitle: string
  /** CSS color used as the module accent */
  accent: string
  estMinutes: number
  blurb: string
  path: string
}

export const MODULES: ModuleMeta[] = [
  {
    id: 'methodology',
    num: 1,
    title: 'Data Science Methodology',
    shortTitle: 'Methodology',
    accent: 'var(--color-m1)',
    estMinutes: 25,
    blurb: 'The 10-stage IBM methodology loop — the spine of every project.',
    path: '/module/methodology',
  },
  {
    id: 'python',
    num: 2,
    title: 'Python for Data Science',
    shortTitle: 'Python',
    accent: 'var(--color-m2)',
    estMinutes: 25,
    blurb: 'NumPy broadcasting, DataFrame anatomy, split-apply-combine, merges.',
    path: '/module/python',
  },
  {
    id: 'sql',
    num: 3,
    title: 'Databases & SQL',
    shortTitle: 'SQL',
    accent: 'var(--color-m3)',
    estMinutes: 30,
    blurb: 'Joins, logical query order, subqueries, and SQL from Python.',
    path: '/module/sql',
  },
  {
    id: 'wrangling',
    num: 4,
    title: 'Data Wrangling',
    shortTitle: 'Wrangling',
    accent: 'var(--color-m4)',
    estMinutes: 30,
    blurb: 'Missing values, scaling, binning, one-hot encoding.',
    path: '/module/wrangling',
  },
  {
    id: 'eda',
    num: 5,
    title: 'EDA & Statistics',
    shortTitle: 'EDA & Stats',
    accent: 'var(--color-m5)',
    estMinutes: 35,
    blurb: "Pearson r, Anscombe's lesson, ANOVA, boxplot anatomy.",
    path: '/module/eda',
  },
  {
    id: 'regression',
    num: 6,
    title: 'Regression & Model Evaluation',
    shortTitle: 'Regression',
    accent: 'var(--color-m6)',
    estMinutes: 45,
    blurb: 'Least squares, the Overfit Lab, cross-validation, ridge, pipelines.',
    path: '/module/regression',
  },
  {
    id: 'dataviz',
    num: 7,
    title: 'Data Visualization',
    shortTitle: 'Data Viz',
    accent: 'var(--color-m7)',
    estMinutes: 30,
    blurb: 'Matplotlib anatomy, chart selection, honest charts, Folium maps.',
    path: '/module/dataviz',
  },
  {
    id: 'ml',
    num: 8,
    title: 'Machine Learning',
    shortTitle: 'ML',
    accent: 'var(--color-m8)',
    estMinutes: 45,
    blurb: 'KNN, trees, SVM, k-means, DBSCAN, recommenders, confusion matrices.',
    path: '/module/ml',
  },
]

export const moduleById = (id: string) => MODULES.find((m) => m.id === id)
