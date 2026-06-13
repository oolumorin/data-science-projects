import type { QuizQuestion } from './types'

export const edaQuiz: QuizQuestion[] = [
  {
    id: 'm5-q1',
    prompt: 'What does df.describe() return for numeric columns?',
    options: [
      'Count, mean, std, min, quartiles, and max for each column',
      'The data types of each column',
      'A list of unique values per column',
      'The number of missing values per column',
    ],
    correctIndex: 0,
    explanation:
      'describe() gives a quick statistical summary — count, mean, standard deviation, min, 25/50/75th percentiles, and max — for every numeric column.',
  },
  {
    id: 'm5-q2',
    prompt: 'df["fuel"].value_counts() on a categorical column returns what?',
    options: [
      'The frequency of each distinct category, sorted descending by default',
      'The mean of the column encoded numerically',
      'A boolean mask of duplicated rows',
      'The total number of rows in the dataframe',
    ],
    correctIndex: 0,
    explanation:
      'value_counts() tallies how often each unique value appears, which is the fastest way to eyeball a categorical column\'s distribution.',
  },
  {
    id: 'm5-q3',
    prompt: 'What is the central lesson of Anscombe\'s Quartet?',
    options: [
      'Datasets can share identical summary statistics (mean, variance, correlation, regression line) yet look completely different when plotted',
      'Correlation always implies causation',
      'Linear regression cannot be computed on small datasets',
      'Histograms are more informative than scatter plots in all cases',
    ],
    correctIndex: 0,
    explanation:
      'All four Anscombe datasets have nearly identical means, variances, correlations, and regression lines, but visibly different relationships — the reason to always plot your data.',
  },
  {
    id: 'm5-q4',
    prompt: 'A scatter plot of ice cream sales vs. drowning incidents shows a strong positive correlation. What is the most likely explanation?',
    options: [
      'A confounding variable (e.g. hot weather) increases both, rather than one causing the other',
      'Ice cream sales directly cause drownings',
      'Drowning incidents directly cause more ice cream sales',
      'The correlation must be a calculation error',
    ],
    correctIndex: 0,
    explanation:
      'This is the classic correlation-vs-causation trap: hot weather drives both more swimming (and drowning risk) and more ice cream sales, with no direct causal link between the two.',
  },
  {
    id: 'm5-q5',
    prompt: 'A scatter shows y = x² over x in [-2, 2]. What is the approximate Pearson r, and what does that mean?',
    options: [
      'r ≈ 0 — Pearson r only captures linear relationships, missing this strong nonlinear one',
      'r ≈ 1 — Pearson r perfectly captures any relationship, linear or not',
      'r ≈ -1 — because y decreases then increases',
      'r is undefined for nonlinear data',
    ],
    correctIndex: 0,
    explanation:
      'Because the parabola is symmetric, positive and negative x deviations cancel out in the covariance term, giving r ≈ 0 despite a perfect deterministic relationship.',
  },
  {
    id: 'm5-q6',
    prompt: 'scipy.stats.pearsonr(x, y) returns which two values?',
    options: [
      'The correlation coefficient r and a p-value for the null hypothesis that r = 0',
      'The slope and intercept of the regression line',
      'The mean of x and the mean of y',
      'Two separate correlation coefficients for x and y',
    ],
    correctIndex: 0,
    explanation:
      'pearsonr returns (r, p) — the correlation coefficient itself and the p-value testing whether the observed correlation could arise from an uncorrelated population by chance.',
  },
  {
    id: 'm5-q7',
    prompt: 'In a one-way ANOVA, what does the F-statistic represent?',
    options: [
      'The ratio of between-group variance to within-group variance',
      'The total variance across all groups combined',
      'The difference between the largest and smallest group means',
      'The correlation between group membership and the outcome variable',
    ],
    correctIndex: 0,
    explanation:
      'F = MS_between / MS_within. A large F means the spread between group means is large relative to the natural spread within each group — evidence the groups differ.',
  },
  {
    id: 'm5-q8',
    prompt: 'Three groups have very similar means but the F-statistic from ANOVA is close to 1. What does this suggest?',
    options: [
      'The groups cannot be reliably distinguished — between-group variation is comparable to within-group noise',
      'The groups are definitely different and the test failed',
      'The sample sizes must be too large',
      'F close to 1 always means a coding error',
    ],
    correctIndex: 0,
    explanation:
      'An F-statistic near 1 means between-group variance is about the same size as within-group variance — the differences in means are no larger than you\'d expect from random noise alone.',
  },
  {
    id: 'm5-q9',
    prompt: 'In a boxplot, what does the box itself (excluding whiskers) represent?',
    options: [
      'The interquartile range (IQR), from Q1 to Q3 — the middle 50% of the data',
      'The full range of the data, min to max',
      'The mean plus and minus one standard deviation',
      'Only the outlier values',
    ],
    correctIndex: 0,
    explanation:
      'The box spans the first to third quartiles (Q1 to Q3), capturing the middle 50% of observations, with a line marking the median.',
  },
  {
    id: 'm5-q10',
    prompt: 'By the common 1.5×IQR rule, a point is flagged as an outlier when it falls...',
    options: [
      'Below Q1 − 1.5×IQR or above Q3 + 1.5×IQR',
      'More than one standard deviation from the mean',
      'Outside the min/max of the dataset',
      'Below the median',
    ],
    correctIndex: 0,
    explanation:
      'The 1.5×IQR rule extends "fences" 1.5 times the interquartile range beyond Q1 and Q3; points beyond those fences are plotted individually as outliers rather than included in the whiskers.',
  },
]
