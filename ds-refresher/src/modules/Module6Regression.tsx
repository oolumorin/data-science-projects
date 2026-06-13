import { ConceptCard } from '../components/ConceptCard'
import { CodeSnippet } from '../components/CodeSnippet'
import { Formula } from '../components/Formula'
import { ModuleIntro, ModuleLayout } from '../components/ModuleLayout'
import { Quiz } from '../components/Quiz'
import { moduleById } from '../lib/modules'
import { regressionQuiz } from '../data/quizzes/regression'
import { LeastSquares } from '../viz/LeastSquares'
import { OverfitLab } from '../viz/OverfitLab'
import { KFoldPlayer } from '../viz/KFoldPlayer'
import { RidgeShrinkage } from '../viz/RidgeShrinkage'
import { PipelineDiagram } from '../viz/PipelineDiagram'

const mod = moduleById('regression')!

const SECTIONS = [
  { id: 'least-squares', label: 'Least squares' },
  { id: 'overfit-lab', label: 'Overfit Lab' },
  { id: 'cross-validation', label: 'Cross-validation' },
  { id: 'ridge', label: 'Ridge' },
  { id: 'pipeline', label: 'Pipelines' },
  { id: 'quiz', label: 'Quiz' },
]

export default function Module6Regression() {
  return (
    <ModuleLayout module={mod} sections={SECTIONS}>
      <ModuleIntro module={mod}>
        Regression is about fitting a curve and then being honest about how well it
        generalizes. This module is the flagship of the refresher — the Overfit Lab below is
        the single most important interactive in the whole app. Drag the degree slider and
        watch the classic U-shaped test-error curve appear.
      </ModuleIntro>

      <ConceptCard
        id="least-squares"
        title="Least squares: minimizing the squares, literally"
        viz={<LeastSquares />}
      >
        <p>
          A regression line is the one that minimizes the sum of squared vertical distances
          (residuals) from each point to the line. Drag either handle — or focus a handle and
          use ↑/↓ — and watch the literal squares grow and shrink. "Snap to best fit" jumps to
          the OLS solution, where the total shaded area is at its minimum.
        </p>
        <Formula tex="\hat{y} = \beta_0 + \beta_1 x \qquad \text{minimize } \sum_i (y_i - \hat{y}_i)^2" />
      </ConceptCard>

      <ConceptCard
        id="overfit-lab"
        title="The Overfit Lab"
        viz={<OverfitLab />}
      >
        <p>
          30 noisy points sample a smooth curve. Drag the <strong>degree</strong> slider from 1
          to 12: a degree-1 line underfits (high error everywhere), a mid-degree polynomial
          tracks the signal, and a degree-12 polynomial chases every noisy wiggle in the
          training set — overfitting. The middle chart shows why this matters: training error
          falls forever, but test error falls then rises, tracing the famous{' '}
          <strong>bias–variance U-curve</strong>. The residual plot at the bottom shows
          structure (a curve in the residuals) when the model is too simple, and erratic noise
          when it's well-fit. Hollow markers are the held-out test points. Resample for a fresh
          noise draw — the U-shape persists.
        </p>
        <Formula tex="\text{MSE} = \frac{1}{n}\sum_i (y_i - \hat{y}_i)^2 \qquad R^2 = 1 - \frac{\sum_i (y_i - \hat{y}_i)^2}{\sum_i (y_i - \bar{y})^2}" />
        <p>
          Multiple linear regression extends this to several predictors
          (ŷ = β₀ + β₁x₁ + β₂x₂ + …); polynomial regression is just multiple regression where
          the extra "predictors" are powers of a single x.
        </p>
        <CodeSnippet
          lang="python"
          title="LinearRegression in scikit-learn"
          code={`
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=0
)

model = LinearRegression()
model.fit(X_train, y_train)

print("train R^2:", model.score(X_train, y_train))
print("test R^2:", model.score(X_test, y_test))
          `}
        />
      </ConceptCard>

      <ConceptCard
        id="cross-validation"
        title="K-fold cross-validation"
        viz={<KFoldPlayer />}
      >
        <p>
          A single train/test split gives one noisy estimate of generalization. K-fold CV
          rotates which slice of the data is held out, fitting k models and validating each on
          the slice it didn't see. Step through the 5 folds — each step highlights the held-out
          fold and adds its R² to a running list. The final step reports the mean ± standard
          deviation, a far more stable performance estimate than any single split.
        </p>
        <CodeSnippet
          lang="python"
          title="cross_val_score"
          code={`
from sklearn.model_selection import cross_val_score

scores = cross_val_score(model, X, y, cv=5, scoring="r2")
print(scores)            # array of 5 R^2 values
print(scores.mean(), scores.std())
          `}
        />
      </ConceptCard>

      <ConceptCard
        id="ridge"
        title="Ridge regression: shrinking coefficients"
        viz={<RidgeShrinkage />}
      >
        <p>
          A degree-8 polynomial overfits badly with ordinary least squares — its coefficients
          blow up to huge, opposite-signed values that cancel out on training data but explode
          on new data. Ridge adds a penalty proportional to α·Σwᵢ² to the loss, shrinking every
          coefficient toward zero. Drag α (log scale): at small α the fit barely changes; at
          large α every coefficient collapses toward zero and the model underfits. The
          test-error curve traces out a sweet spot — the green dot — between those extremes.
        </p>
        <Formula tex="\text{minimize } \sum_i (y_i - \hat{y}_i)^2 + \alpha \sum_{j \geq 1} w_j^2" />
      </ConceptCard>

      <ConceptCard
        id="pipeline"
        title="Pipelines: chaining transforms and a model"
        viz={<PipelineDiagram />}
      >
        <p>
          A Pipeline bundles preprocessing and modeling into one object with one .fit() and one
          .predict(). Each step calls <code>fit_transform</code> on training data and{' '}
          <code>transform</code> on new data — so the scaler's mean/std and the polynomial
          expansion are learned once on the training set and applied consistently everywhere.
          Click each block to see why the order (scale → expand → regularize) matters.
        </p>
        <CodeSnippet
          lang="python"
          title="Pipeline + GridSearchCV"
          code={`
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.linear_model import Ridge
from sklearn.model_selection import GridSearchCV

pipe = Pipeline([
    ("scale", StandardScaler()),
    ("poly", PolynomialFeatures(2)),
    ("model", Ridge(alpha=0.1)),
])

param_grid = {
    "poly__degree": [1, 2, 3, 4],
    "model__alpha": [0.01, 0.1, 1, 10],
}

search = GridSearchCV(pipe, param_grid, cv=5, scoring="r2")
search.fit(X_train, y_train)

print(search.best_params_, search.best_score_)
          `}
        />
      </ConceptCard>

      <ConceptCard id="quiz" title="Check yourself">
        <Quiz moduleId="regression" questions={regressionQuiz} />
      </ConceptCard>
    </ModuleLayout>
  )
}
