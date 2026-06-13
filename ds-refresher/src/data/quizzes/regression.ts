import type { QuizQuestion } from './types'

export const regressionQuiz: QuizQuestion[] = [
  {
    id: 'm6-q1',
    prompt: 'Geometrically, ordinary least squares finds the line that minimizes what?',
    options: [
      'The sum of squared vertical distances between each point and the line',
      'The sum of absolute horizontal distances between each point and the line',
      'The number of points the line passes through exactly',
      'The maximum vertical distance from any single point to the line',
    ],
    correctIndex: 0,
    explanation:
      'OLS minimizes the sum of squared residuals (vertical distances) — squaring penalizes large errors more and keeps the math differentiable, giving a closed-form solution.',
  },
  {
    id: 'm6-q2',
    prompt: 'As polynomial degree increases on a fixed training set, what happens to the training error?',
    options: [
      'It decreases (or stays flat), monotonically — more flexibility always fits the training points at least as well',
      'It increases monotonically because higher-degree models are harder to optimize',
      'It follows the same U-shape as the test error',
      'It stays exactly constant regardless of degree',
    ],
    correctIndex: 0,
    explanation:
      'A higher-degree polynomial is strictly more flexible — it can always match or beat a lower-degree fit on the training data, so training error is monotonically non-increasing.',
  },
  {
    id: 'm6-q3',
    prompt: 'In the Overfit Lab, why does test error eventually rise even though training error keeps falling?',
    options: [
      'The high-degree polynomial starts fitting the noise in the training data, not the underlying signal, so it generalizes poorly',
      'The test set changes every time the degree changes',
      'Higher-degree polynomials always have larger coefficients by definition, which the test metric penalizes directly',
      'R² is undefined for degrees above 5',
    ],
    correctIndex: 0,
    explanation:
      'This is overfitting: a flexible model memorizes idiosyncratic noise in the training sample, so its predictions on unseen (test) points get worse even as training fit keeps improving.',
  },
  {
    id: 'm6-q4',
    prompt: 'A model with high bias and low variance is best described as:',
    options: [
      'Underfitting — too simple to capture the true pattern, consistently wrong in the same way',
      'Overfitting — too complex, sensitive to the specific training sample',
      'Perfectly fit — bias and variance are both irrelevant once R² is high',
      'Impossible — bias and variance always move together',
    ],
    correctIndex: 0,
    explanation:
      'High bias means the model is too simple to capture the true relationship (e.g., a degree-1 line for a curved signal) — it underfits and makes systematic errors regardless of which sample it was trained on.',
  },
  {
    id: 'm6-q5',
    prompt: 'What is the main purpose of a train/test split before evaluating a model?',
    options: [
      'To estimate how the model will perform on data it has not seen, avoiding an overly optimistic in-sample score',
      'To make the dataset smaller so training runs faster',
      'To remove outliers from the dataset automatically',
      'To guarantee the model achieves R² = 1',
    ],
    correctIndex: 0,
    explanation:
      'In-sample metrics (computed on the data used to fit the model) are optimistic. Holding out a test set gives an honest estimate of generalization to new data.',
  },
  {
    id: 'm6-q6',
    prompt: 'In k-fold cross-validation with k=5, how many times is each individual data point used for validation?',
    options: [
      'Exactly once — each point falls in exactly one fold, which is held out exactly once',
      'Five times — every point is validated against every fold',
      'Zero times — CV only uses training data',
      'It depends on the random seed and varies point to point',
    ],
    correctIndex: 0,
    explanation:
      'The data is partitioned into k disjoint folds. Each fold serves as the validation set exactly once (while the other k−1 folds train), so every point is validated exactly once across the k rounds.',
  },
  {
    id: 'm6-q7',
    prompt: 'Why report the mean ± standard deviation of cross-validation scores rather than a single train/test split score?',
    options: [
      'A single split can be lucky or unlucky; averaging over multiple folds gives a more stable estimate and the spread shows how sensitive performance is to the sample',
      'The mean is always higher than any single split score',
      'Standard deviation is required by scikit-learn and has no statistical meaning',
      'It removes the need for a separate test set entirely, even for final reporting',
    ],
    correctIndex: 0,
    explanation:
      'CV reduces the variance of the performance estimate by averaging across folds, and the standard deviation quantifies how much that estimate would vary with a different sample.',
  },
  {
    id: 'm6-q8',
    prompt: 'What does the ridge regression penalty add to the ordinary least squares loss?',
    options: [
      'A term proportional to alpha times the sum of squared coefficients, discouraging large weights',
      'A term that forces the intercept to zero',
      'A term that counts the number of features used',
      'A term that is independent of alpha and always equal to the MSE',
    ],
    correctIndex: 0,
    explanation:
      'Ridge minimizes MSE + α·Σwᵢ² (excluding the intercept). Larger α shrinks coefficients more aggressively toward zero, trading a little bias for less variance.',
  },
  {
    id: 'm6-q9',
    prompt: 'In a scikit-learn Pipeline([("scale", StandardScaler()), ("poly", PolynomialFeatures(2)), ("model", Ridge())]), why must StandardScaler come before PolynomialFeatures?',
    options: [
      'Squaring or multiplying unscaled features can produce huge value ranges, which then dominate both the polynomial expansion and the ridge penalty unevenly',
      'PolynomialFeatures cannot run unless the input is already centered to exactly zero',
      'Order does not actually matter — Pipeline reorders steps automatically for numerical stability',
      'StandardScaler removes the target variable, which PolynomialFeatures requires to be absent',
    ],
    correctIndex: 0,
    explanation:
      'Scaling first keeps all features on a comparable range before they are expanded into polynomial terms, so no single original feature\'s scale distorts the expanded feature space or the ridge penalty.',
  },
  {
    id: 'm6-q10',
    prompt: 'What does GridSearchCV(model, param_grid, cv=5) do?',
    options: [
      'Exhaustively tries every combination of hyperparameters in param_grid, evaluating each with 5-fold cross-validation, and reports the best-performing combination',
      'Trains the model once on the full dataset and reports its R²',
      'Randomly samples one hyperparameter combination and fits it 5 times',
      'Removes 5 features from the dataset before fitting',
    ],
    correctIndex: 0,
    explanation:
      'GridSearchCV performs an exhaustive search over the specified hyperparameter grid, using cross-validation (here 5-fold) to score each combination, then exposes the best estimator and parameters.',
  },
]
