import type { QuizQuestion } from './types'

export const wranglingQuiz: QuizQuestion[] = [
  {
    id: 'm4-q1',
    prompt: 'A numeric column is missing 45% of its values, and the missingness looks random. What is the recommended action?',
    options: [
      'Drop the column',
      'Impute with the mean',
      'Impute with the mode',
      'Use predictive imputation',
    ],
    correctIndex: 0,
    explanation:
      'When more than ~30% of a column is missing, imputation would dominate the column with manufactured values — usually better to drop it entirely.',
  },
  {
    id: 'm4-q2',
    prompt: 'A categorical column has 10% missing values, and missingness does NOT look random — it correlates with another column. What should you do?',
    options: [
      'Predictive imputation (model the missing values from other columns)',
      'Drop the column',
      'Fill with the mode regardless',
      'Drop all rows with any missing value',
    ],
    correctIndex: 0,
    explanation:
      'When missingness depends on other features (missing not at random), a simple mode fill would bias the data. Predicting the missing values from related columns is safer.',
  },
  {
    id: 'm4-q3',
    prompt: 'What does pd.to_numeric(df["price"], errors="coerce") do to a column containing some non-numeric strings?',
    options: [
      'Converts valid numeric strings to numbers and turns invalid ones into NaN',
      'Raises an error and stops execution',
      'Converts every value to a string',
      'Drops the entire column',
    ],
    correctIndex: 0,
    explanation:
      '"coerce" tells pandas to convert what it can to numeric dtype and replace anything it cannot parse with NaN, rather than raising.',
  },
  {
    id: 'm4-q4',
    prompt: 'Why might simple scaling (x / max) be insufficient compared to min-max scaling?',
    options: [
      'It does not anchor the minimum value to 0, so the scaled range depends on how far the data sits from 0',
      'It always produces negative values',
      'It changes the shape of the distribution more than z-score does',
      'It cannot be computed for skewed data',
    ],
    correctIndex: 0,
    explanation:
      'x / max only rescales by the maximum — if the minimum is far from 0, the scaled values won\'t span the full [0, 1] range the way min-max scaling guarantees.',
  },
  {
    id: 'm4-q5',
    prompt: 'A right-skewed price column is z-score normalized. What happens to its mean and standard deviation?',
    options: [
      'Mean becomes 0 and standard deviation becomes 1',
      'Mean becomes 1 and standard deviation becomes 0',
      'Both become equal to the original median',
      'Mean and standard deviation are unchanged',
    ],
    correctIndex: 0,
    explanation:
      'Z-score scaling, z = (x − μ) / σ, recenters the data to mean 0 and rescales it to standard deviation 1 — though the skewed shape itself remains.',
  },
  {
    id: 'm4-q6',
    prompt: 'What is the main effect of increasing the number of bins in a histogram from 5 to 20?',
    options: [
      'The histogram shows finer detail but each bin has fewer points, making it noisier',
      'The total area under the histogram increases',
      'The data values themselves change',
      'The histogram becomes smoother and less detailed',
    ],
    correctIndex: 0,
    explanation:
      'More bins means narrower bin widths — you see finer structure, but each bin holds fewer observations, so counts become noisier and patterns can fragment.',
  },
  {
    id: 'm4-q7',
    prompt: 'What does pd.get_dummies(df["fuel"]) produce for a column with categories gas, diesel, electric?',
    options: [
      'One binary (0/1) column per category, indicating presence of that category in each row',
      'A single column re-coded as 0, 1, 2',
      'A new column containing the count of each category',
      'A column of strings concatenating all categories',
    ],
    correctIndex: 0,
    explanation:
      'One-hot encoding via get_dummies creates a separate binary column per category — each row has a 1 in exactly the column matching its category and 0 elsewhere.',
  },
  {
    id: 'm4-q8',
    prompt: 'Why use one-hot encoding instead of simply mapping categories to integers (0, 1, 2, ...) for a nominal variable like fuel type?',
    options: [
      'Integer codes imply an ordering/magnitude relationship that does not exist between nominal categories',
      'One-hot encoding uses less memory than integer codes',
      'Models cannot accept integer-valued columns at all',
      'One-hot encoding is required by pandas for all categorical columns',
    ],
    correctIndex: 0,
    explanation:
      'Coding gas=0, diesel=1, electric=2 would imply diesel is "between" gas and electric numerically — a false ordinal relationship. One-hot avoids inventing that structure.',
  },
  {
    id: 'm4-q9',
    prompt: 'df.dropna() vs df.fillna(df["col"].mean()) — what is the key tradeoff?',
    options: [
      'dropna() loses entire rows (and their other columns\' data); fillna with the mean keeps rows but can dampen variance',
      'dropna() is always better because it keeps the dataset larger',
      'fillna() removes the column entirely',
      'There is no difference — both produce identical results',
    ],
    correctIndex: 0,
    explanation:
      'Dropping rows discards potentially useful data in other columns of those rows, while mean imputation keeps the rows but can artificially shrink the column\'s variance.',
  },
  {
    id: 'm4-q10',
    prompt: 'Which pandas method would you use to explicitly cast a column to a different dtype, e.g. from object to category?',
    options: ['df["col"].astype("category")', 'df["col"].dropna()', 'df["col"].fillna(0)', 'df["col"].describe()'],
    correctIndex: 0,
    explanation:
      'astype() converts a column\'s dtype explicitly — useful for memory savings and signaling to pandas/models that a column is categorical rather than free text.',
  },
]
