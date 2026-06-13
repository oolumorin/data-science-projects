import { ConceptCard } from '../components/ConceptCard'
import { ModuleIntro, ModuleLayout } from '../components/ModuleLayout'
import { Quiz } from '../components/Quiz'
import { CodeSnippet } from '../components/CodeSnippet'
import { Formula } from '../components/Formula'
import { moduleById } from '../lib/modules'
import { mlQuiz } from '../data/quizzes/ml'
import { MethodologyLoop } from '../viz/MethodologyLoop'
import { KnnPlayground } from '../viz/KnnPlayground'
import { DecisionTreeBuilder } from '../viz/DecisionTreeBuilder'
import { LogisticThreshold } from '../viz/LogisticThreshold'
import { SvmMargins } from '../viz/SvmMargins'
import { KMeansPlayground } from '../viz/KMeansPlayground'
import { HierarchicalClustering } from '../viz/HierarchicalClustering'
import { DbscanLab } from '../viz/DbscanLab'
import { RecommenderMatrix } from '../viz/RecommenderMatrix'
import { ConfusionMatrixLab } from '../viz/ConfusionMatrixLab'

const mod = moduleById('ml')!

const SECTIONS = [
  { id: 'knn', label: 'KNN' },
  { id: 'trees', label: 'Decision trees' },
  { id: 'logistic', label: 'Logistic regression' },
  { id: 'svm', label: 'SVM margins' },
  { id: 'kmeans', label: 'K-means' },
  { id: 'hierarchical', label: 'Hierarchical clustering' },
  { id: 'dbscan', label: 'DBSCAN' },
  { id: 'recommenders', label: 'Recommenders' },
  { id: 'confusion', label: 'Confusion matrix' },
  { id: 'metrics', label: 'Jaccard & log loss' },
  { id: 'capstone', label: 'Capstone retrospective' },
  { id: 'quiz', label: 'Quiz' },
]

export default function Module8MachineLearning() {
  return (
    <ModuleLayout module={mod} sections={SECTIONS}>
      <ModuleIntro module={mod}>
        Machine learning is the Modeling stage of the methodology loop made concrete: algorithms
        that learn patterns from data and make predictions or find structure. This module covers
        the core families — classification, clustering, recommenders — and how to evaluate them
        honestly. Every interactive runs the real algorithm on seeded toy data, in your browser.
      </ModuleIntro>

      {/* ---------------- 8a. Classification ---------------- */}

      <ConceptCard
        id="knn"
        title="K-Nearest Neighbors: vote with your neighbors"
        viz={<KnnPlayground />}
        code={
          <CodeSnippet
            lang="python"
            title="knn.py"
            code={`
from sklearn.neighbors import KNeighborsClassifier

knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(X_train, y_train)
knn.predict(X_test)
`}
          />
        }
      >
        <p>
          KNN has no training phase — it just memorizes the data. To classify a new point, find
          its <strong>k</strong> closest neighbors and take a majority vote. Click anywhere on the
          canvas to drop the query point (arrow keys move it once focused), and drag the{' '}
          <strong>k</strong> slider to see the vote — and sometimes the prediction itself — change.
          Toggle the decision-boundary backdrop to see how k smooths the boundary.
        </p>
      </ConceptCard>

      <ConceptCard
        id="trees"
        title="Decision trees: recursive axis-aligned splits"
        viz={<DecisionTreeBuilder />}
        code={
          <CodeSnippet
            lang="python"
            title="tree.py"
            code={`
from sklearn.tree import DecisionTreeClassifier

tree = DecisionTreeClassifier(max_depth=4, criterion='gini')
tree.fit(X_train, y_train)
tree.predict(X_test)
`}
          />
        }
      >
        <p>
          A decision tree repeatedly picks the feature and threshold that best separates the two
          classes — measured by <strong>Gini impurity</strong>. Step through the build: each step
          adds one split, visible both as a line partitioning the plane and as a new node in the
          tree diagram (highlighted). Try max depth 4 — watch tiny sliver regions appear, each one
          carved out to capture a single stray point. That is overfitting in geometric form.
        </p>
      </ConceptCard>

      <ConceptCard
        id="logistic"
        title="Logistic regression: a threshold on a probability"
        viz={<LogisticThreshold />}
        code={
          <CodeSnippet
            lang="python"
            title="logreg.py"
            code={`
from sklearn.linear_model import LogisticRegression

clf = LogisticRegression()
clf.fit(X_train, y_train)
proba = clf.predict_proba(X_test)[:, 1]
preds = (proba >= 0.5).astype(int)   # default threshold
`}
          />
        }
      >
        <p>
          Logistic regression fits a linear combination of features, then squashes it through the
          sigmoid σ(z) to get a probability. The classification threshold (default 0.5) decides
          where probability becomes "class 1". Drag the slider: on the left, points slide along
          the sigmoid; on the right, the linear decision boundary shifts in the 2D scatter, and
          misclassified points get a red outline.
        </p>
      </ConceptCard>

      <ConceptCard
        id="svm"
        title="SVM: maximizing the margin"
        viz={<SvmMargins />}
        code={
          <CodeSnippet
            lang="python"
            title="svm.py"
            code={`
from sklearn.svm import SVC

svm = SVC(kernel='linear', C=1.0)
svm.fit(X_train, y_train)
svm.predict(X_test)
`}
          />
        }
      >
        <p>
          A support vector machine finds the line that separates the classes with the{' '}
          <strong>widest margin</strong>. Points on or inside the margin are{' '}
          <strong>support vectors</strong> (ringed). The <strong>C</strong> slider controls the
          soft-margin trade-off: small C tolerates more violations for a wider margin; large C
          shrinks the margin to reduce violations, risking overfitting to outliers. (RBF kernels
          are out of scope here — this is the linear case.)
        </p>
      </ConceptCard>

      {/* ---------------- 8b. Clustering ---------------- */}

      <ConceptCard
        id="kmeans"
        title="K-means: assign, then update, repeat"
        viz={<KMeansPlayground />}
        code={
          <CodeSnippet
            lang="python"
            title="kmeans.py"
            code={`
from sklearn.cluster import KMeans

km = KMeans(n_clusters=3, n_init=10, random_state=0)
km.fit(X)
labels = km.labels_
inertia = km.inertia_
`}
          />
        }
      >
        <p>
          K-means alternates two steps: <strong>assign</strong> each point to its nearest centroid
          (points take that centroid's color), then <strong>update</strong> each centroid to the
          mean of its assigned points (centroids glide). Step through it, or use "new random init"
          to see how starting positions affect the path to convergence. The elbow chart on the
          right plots final inertia for each k — the bend at k=3 matches the three seeded blobs.
        </p>
      </ConceptCard>

      <ConceptCard
        id="hierarchical"
        title="Hierarchical clustering: merge the closest pair, repeat"
        viz={<HierarchicalClustering />}
        code={
          <CodeSnippet
            lang="python"
            title="agglomerative.py"
            code={`
from sklearn.cluster import AgglomerativeClustering

agg = AgglomerativeClustering(n_clusters=3, linkage='single')
labels = agg.fit_predict(X)
`}
          />
        }
      >
        <p>
          Agglomerative clustering starts with every point as its own cluster and repeatedly
          merges the two closest clusters (here, <strong>single linkage</strong> — the distance
          between their nearest members). Step through the merges and watch the dendrogram grow,
          with merge heights recorded. Drag the cut-height slider to "slice" the dendrogram at any
          height — the scatter recolors to match the resulting clusters.
        </p>
      </ConceptCard>

      <ConceptCard
        id="dbscan"
        title="DBSCAN: clusters as dense, connected regions"
        viz={<DbscanLab />}
        code={
          <CodeSnippet
            lang="python"
            title="dbscan.py"
            code={`
from sklearn.cluster import DBSCAN

db = DBSCAN(eps=0.8, min_samples=4)
labels = db.fit_predict(X)
# labels == -1 means "noise"
`}
          />
        }
      >
        <p>
          DBSCAN labels a point a <strong>core</strong> point if at least <code>minPts</code>{' '}
          points (including itself) lie within <code>eps</code>. Clusters grow by chaining
          core points together; points reachable from a core but not core themselves are{' '}
          <strong>border</strong> points (hollow); everything else is <strong>noise</strong> (×).
          Hover or focus a point to see its eps-radius. Switch to "moons" — k-means would carve
          this into two halves through the middle, but DBSCAN follows the curved shape.
        </p>
      </ConceptCard>

      {/* ---------------- 8c. Recommenders ---------------- */}

      <ConceptCard
        id="recommenders"
        title="Recommenders: content-based vs collaborative filtering"
        viz={<RecommenderMatrix />}
        code={
          <CodeSnippet
            lang="python"
            title="recommender.py"
            code={`
import numpy as np

def cosine_sim(a, b):
    mask = (a > 0) & (b > 0)        # only shared ratings
    if mask.sum() == 0:
        return 0.0
    return (a[mask] @ b[mask]) / (
        np.linalg.norm(a[mask]) * np.linalg.norm(b[mask])
    )
`}
          />
        }
      >
        <p>
          The matrix is users × items, mostly empty (sparse ratings). In{' '}
          <strong>content-based</strong> mode, picking a cell lights up the most similar{' '}
          <em>item columns</em> — "people who liked this also liked similar items".{' '}
          <strong>Collaborative</strong> mode instead lights up similar <em>user rows</em> —
          "users like you rated this highly". Click any cell to walk through a prediction:
          similarity-weighted average of the nearest neighbors' ratings.
        </p>
      </ConceptCard>

      {/* ---------------- 8d. Evaluation ---------------- */}

      <ConceptCard
        id="confusion"
        title="The confusion matrix: precision vs recall"
        viz={<ConfusionMatrixLab />}
      >
        <p>
          Reusing the logistic regression from earlier, the threshold slider moves predictions
          between the four quadrants of the confusion matrix in real time. Watch precision and
          recall move in opposite directions as the threshold rises: fewer positive predictions
          means fewer false alarms (higher precision) but more missed positives (lower recall).
        </p>
      </ConceptCard>

      <div className="grid gap-6 sm:grid-cols-2">
        <ConceptCard
          id="jaccard"
          title="Jaccard index"
          viz={
            <div className="rounded-xl border border-ink-700 bg-ink-900 p-4">
              <Formula tex="J(A,B) = \dfrac{|A \cap B|}{|A \cup B|}" />
              <p className="mt-2 font-mono text-xs text-ink-300">
                y_true = {'{1, 2, 3, 4}'}, y_pred = {'{2, 3, 4, 5}'}
                <br />
                intersection = {'{2,3,4}'} (3) · union = {'{1,2,3,4,5}'} (5)
                <br />
                J = 3 / 5 = <span className="accent-text">0.6</span>
              </p>
            </div>
          }
        >
          <p>
            The Jaccard index measures overlap between two sets as a fraction of their combined
            size — useful for comparing predicted vs actual label sets (e.g. multi-label
            tagging), or comparing two cluster assignments.
          </p>
        </ConceptCard>

        <ConceptCard
          id="logloss"
          title="Log loss"
          viz={
            <div className="rounded-xl border border-ink-700 bg-ink-900 p-4">
              <Formula tex="\text{log loss} = -\big[y\log(p) + (1-y)\log(1-p)\big]" />
              <p className="mt-2 font-mono text-xs text-ink-300">
                true label y = 0
                <br />
                confident-wrong: p = 0.9 → loss = {(-Math.log(1 - 0.9)).toFixed(2)}
                <br />
                honest-wrong: p = 0.6 → loss = {(-Math.log(1 - 0.6)).toFixed(2)}
              </p>
            </div>
          }
        >
          <p>
            Log loss penalizes confident wrong predictions much more than uncertain wrong ones.
            Being 90% sure of the wrong answer costs roughly{' '}
            {((-Math.log(1 - 0.9)) / (-Math.log(1 - 0.6))).toFixed(1)}× more than a wrong guess
            made with only 60% confidence — it rewards calibrated uncertainty.
          </p>
        </ConceptCard>
      </div>

      {/* ---------------- Capstone retrospective ---------------- */}

      <ConceptCard
        id="capstone"
        title="Capstone retrospective: Segmenting Toronto neighborhoods"
        viz={<MethodologyLoop compact litStages={[0, 3, 5, 6]} />}
      >
        <p>
          The 2019 capstone — "Segmenting and Clustering Toronto Neighborhoods" — was a complete
          tour of this methodology loop, using techniques from across this app:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Business Understanding (M1):</strong> the question — which Toronto
            neighborhoods are similar in character, based on the venues nearby?
          </li>
          <li>
            <strong>Data Collection (M2):</strong> postal-code geography plus venue data pulled
            from the Foursquare API.
          </li>
          <li>
            <strong>Data Preparation (M4):</strong> wrangling the venue categories into a
            one-hot encoded frequency table per neighborhood.
          </li>
          <li>
            <strong>Modeling (M8b):</strong> <strong>k-means</strong> clustered neighborhoods
            into groups with similar venue mixes — exactly the algorithm above, on real data.
          </li>
        </ul>
      </ConceptCard>

      <ConceptCard id="quiz" title="Check yourself">
        <Quiz moduleId="ml" questions={mlQuiz} />
      </ConceptCard>
    </ModuleLayout>
  )
}
