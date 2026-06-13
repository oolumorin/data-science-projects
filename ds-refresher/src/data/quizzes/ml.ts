import type { QuizQuestion } from './types'

export const mlQuiz: QuizQuestion[] = [
  {
    id: 'm8-q1',
    prompt: 'In K-Nearest Neighbors, what happens to the decision boundary as k increases?',
    options: [
      'It generally becomes smoother, since each prediction averages more neighbors',
      'It becomes jagged and overfits more sharply',
      'It stops depending on the data entirely',
      'It only affects training time, never the boundary shape',
    ],
    correctIndex: 0,
    explanation:
      'A larger k means each prediction is a majority vote over more points, which smooths out noise but can blur fine structure — too large a k can underfit.',
  },
  {
    id: 'm8-q2',
    prompt: 'A greedy CART decision tree picks each split by minimizing what?',
    options: [
      'Weighted Gini impurity of the resulting child nodes',
      'The Euclidean distance between class centroids',
      'The total number of leaves in the tree',
      'The correlation between the two features',
    ],
    correctIndex: 0,
    explanation:
      'At each node, CART tries candidate splits and picks the one that produces the lowest weighted-average Gini impurity across the two children — the purest possible split.',
  },
  {
    id: 'm8-q3',
    prompt: 'Why can a decision tree with max depth 4 show "sliver" regions chasing single points?',
    options: [
      'Deep trees keep splitting to isolate individual training points, overfitting to noise',
      'Because Gini impurity is undefined past depth 2',
      'Because the tree always balances class counts exactly',
      'Sliver regions only appear when using entropy instead of Gini',
    ],
    correctIndex: 0,
    explanation:
      'Each additional level lets the tree carve smaller and smaller axis-aligned boxes; at high depth these boxes can shrink around individual outliers — classic overfitting.',
  },
  {
    id: 'm8-q4',
    prompt: 'In logistic regression, raising the classification threshold from 0.5 to 0.8 typically does what?',
    options: [
      'Fewer points are predicted positive, reducing false positives but increasing false negatives',
      'Fewer points are predicted positive, reducing false negatives but increasing false positives',
      'Has no effect on predictions, only on the fitted weights',
      'Forces the model to retrain with different features',
    ],
    correctIndex: 0,
    explanation:
      'A higher threshold demands more confidence before predicting the positive class, so positives become rarer — precision tends to rise (fewer FPs) while recall tends to fall (more FNs).',
  },
  {
    id: 'm8-q5',
    prompt: 'In a soft-margin SVM, what does increasing C do?',
    options: [
      'Penalizes margin violations more heavily, producing a narrower margin with fewer violations',
      'Widens the margin regardless of training errors',
      'Switches the kernel from linear to RBF',
      'Removes the need for support vectors',
    ],
    correctIndex: 0,
    explanation:
      'C controls the trade-off between margin width and misclassification penalty. Large C pushes the solver toward a narrower margin that tolerates fewer violations (closer to a hard margin); small C allows a wider margin with more violations.',
  },
  {
    id: 'm8-q6',
    prompt: 'In the k-means algorithm, what happens during the "update" step?',
    options: [
      'Each centroid moves to the mean position of the points currently assigned to it',
      'Each point is reassigned to its nearest centroid',
      'The value of k is automatically increased by one',
      'Outlier points are removed from the dataset',
    ],
    correctIndex: 0,
    explanation:
      'k-means alternates: assign each point to its nearest centroid, then update each centroid to the mean of its assigned points. It converges when assignments stop changing.',
  },
  {
    id: 'm8-q7',
    prompt: 'On an elbow chart of inertia vs k, the "elbow" point suggests what?',
    options: [
      'A k beyond which adding more clusters gives diminishing reductions in inertia',
      'The exact k that minimizes inertia to zero',
      'The k where DBSCAN would produce the same clusters',
      'The maximum allowed value of k for the dataset',
    ],
    correctIndex: 0,
    explanation:
      'Inertia always decreases as k grows (more centroids fit the data more tightly), but past the true cluster count the gains flatten — the "elbow" is a heuristic for choosing k.',
  },
  {
    id: 'm8-q8',
    prompt: 'In hierarchical clustering with single linkage, the distance between two clusters is defined as:',
    options: [
      'The distance between their closest pair of points',
      'The distance between their centroids',
      'The average distance between all pairs of points',
      'The distance between their farthest pair of points',
    ],
    correctIndex: 0,
    explanation:
      'Single linkage merges the two clusters whose nearest members are closest together — it can produce elongated "chained" clusters, unlike complete or average linkage.',
  },
  {
    id: 'm8-q9',
    prompt: 'Why does DBSCAN succeed on the two-moons dataset where k-means fails?',
    options: [
      'DBSCAN groups points by density-connected regions, so it can trace curved/non-convex shapes; k-means assumes round, convex blobs around centroids',
      'DBSCAN always produces exactly 2 clusters by default',
      'k-means cannot handle 2D data at all',
      'DBSCAN ignores the eps and minPts parameters on non-convex data',
    ],
    correctIndex: 0,
    explanation:
      'k-means partitions space by nearest centroid, which only carves convex regions. DBSCAN instead follows chains of nearby (dense) points, so it can trace the curved arms of interleaved moons.',
  },
  {
    id: 'm8-q10',
    prompt: 'A model predicts 0.9 confidence for the positive class, but the true label is negative. Compared to a model that predicted 0.6 and was also wrong, the log loss penalty is:',
    options: [
      'Much larger for the 0.9 prediction — log loss penalizes confident wrong answers heavily',
      'Identical, since both predictions were wrong',
      'Smaller for the 0.9 prediction, since it was "more decisive"',
      'Zero in both cases, since log loss only applies to correct predictions',
    ],
    correctIndex: 0,
    explanation:
      'Log loss is -log(p) for the true class. A confident-but-wrong prediction (p close to 0 for the true class, e.g. predicting 0.9 for the wrong class means only 0.1 for the true one) gives a much larger -log(p) than a less confident wrong guess (0.4 for the true class) — confidence amplifies the penalty for being wrong.',
  },
]
