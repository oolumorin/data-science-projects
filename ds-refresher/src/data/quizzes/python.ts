import type { QuizQuestion } from './types'

export const pythonQuiz: QuizQuestion[] = [
  {
    id: 'm2-q1',
    prompt: 'You add a NumPy array of shape (3, 4) to one of shape (4,). What happens?',
    options: [
      'The (4,) array is broadcast across each of the 3 rows and added element-wise',
      'NumPy raises a shape error immediately',
      'The (4,) array is tiled into a (3, 4) array by repeating it as columns',
      'Only the first row of the (3, 4) array is used',
    ],
    correctIndex: 0,
    explanation:
      'Broadcasting aligns shapes on trailing dimensions: (3,4) vs (4,) becomes (3,4) vs (1,4), and the size-1 dimension is stretched (conceptually) across all 3 rows.',
  },
  {
    id: 'm2-q2',
    prompt: 'Which pair of shapes is NOT broadcastable?',
    options: [
      '(2, 3) and (3, 2)',
      '(3, 4) and (3, 1)',
      '(3, 1) and (1, 4)',
      '(5, 4) and (4,)',
    ],
    correctIndex: 0,
    explanation:
      'Aligning trailing dims: 3 vs 2 — neither is 1 and they differ, so this pair fails the broadcasting rule. The other three pairs each have matching or size-1 trailing dimensions.',
  },
  {
    id: 'm2-q3',
    prompt: 'In a pandas DataFrame, what does the "dtype" of a column describe?',
    options: [
      'The data type pandas stores that column as (e.g. int64, float64, object)',
      'The name of the column as it appears in the header',
      'Whether the column is currently sorted',
      'The number of unique values in the column',
    ],
    correctIndex: 0,
    explanation:
      'Each column has a single dtype — int64, float64, object (often strings), bool, datetime64, etc. — which determines what operations are valid and how memory is used.',
  },
  {
    id: 'm2-q4',
    prompt: 'What is the key difference between df.loc[...] and df.iloc[...]?',
    options: [
      '.loc selects by label (index/column names); .iloc selects by integer position',
      '.loc only works on columns; .iloc only works on rows',
      '.loc is faster but .iloc is more readable',
      'They are interchangeable aliases for the same operation',
    ],
    correctIndex: 0,
    explanation:
      '.loc["row_label", "col_label"] uses the index and column labels, while .iloc[0, 1] uses purely integer positions — important when the index is not a simple 0..n range.',
  },
  {
    id: 'm2-q5',
    prompt: 'In df.groupby("city")["price"].mean(), what does the "split" step do?',
    options: [
      'Partitions the rows into separate groups, one per unique city',
      'Removes the city column from the DataFrame',
      'Sorts the DataFrame by price',
      'Splits the price column into bins',
    ],
    correctIndex: 0,
    explanation:
      '"Split" divides the rows into groups sharing the same city value. "Apply" then computes mean(price) within each group, and "combine" assembles the per-group results into one output.',
  },
  {
    id: 'm2-q6',
    prompt: 'You merge employees (left) and departments (right) with how="left" on dept_id. An employee has a dept_id with no matching department. What happens to that row?',
    options: [
      'The employee row is kept, with NaN in the department columns',
      'The employee row is dropped from the result',
      'The merge raises an error',
      'The employee row is duplicated once for every department',
    ],
    correctIndex: 0,
    explanation:
      'A left merge keeps every row from the left table regardless of whether a match exists; unmatched columns from the right table are filled with NaN.',
  },
  {
    id: 'm2-q7',
    prompt: 'Which merge "how" keeps only rows where the join key exists in BOTH tables?',
    options: ['inner', 'left', 'right', 'outer'],
    correctIndex: 0,
    explanation:
      'An inner merge keeps the intersection of keys — rows must have a match on both sides. outer keeps the union (with NaNs for non-matches), left/right keep all rows from one side.',
  },
  {
    id: 'm2-q8',
    prompt: 'After pd.merge(left, right, on="key", how="outer"), a row came only from "right" with no match in "left". What do the "left" columns contain for that row?',
    options: ['NaN', '0', 'An empty string ""', 'The row is dropped'],
    correctIndex: 0,
    explanation:
      'Outer merges keep every key from both sides; any side that lacks a match for a given key gets NaN in its columns for that row.',
  },
  {
    id: 'm2-q9',
    prompt: 'Which function reads a JSON file (or API response body) directly into a pandas DataFrame?',
    options: ['pd.read_json(...)', 'pd.read_csv(...)', 'pd.DataFrame.from_array(...)', 'pd.load_json(...)'],
    correctIndex: 0,
    explanation:
      'pd.read_json() parses JSON text or a file path into a DataFrame. For a live API, you typically call requests.get(url).json() and then pass that dict/list to pd.DataFrame(...).',
  },
  {
    id: 'm2-q10',
    prompt: 'Broadcasting (3, 1) with (1, 4) produces what result shape?',
    options: ['(3, 4)', '(3, 1)', '(1, 4)', '(4, 3)'],
    correctIndex: 0,
    explanation:
      'Each dimension is the max of the two (since the other is 1): dim 0 → max(3,1)=3, dim 1 → max(1,4)=4, giving a (3, 4) result where both inputs are stretched.',
  },
]
