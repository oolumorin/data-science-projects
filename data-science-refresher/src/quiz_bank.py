"""
quiz_bank.py — retrieval-practice questions for Quiz Mode.

Educational purpose: spaced retrieval is how a refresher sticks. Each question
names the workflow stage it tests, gives four options, and — most importantly —
an explanation. Getting it wrong with a good explanation teaches more than
getting it right by luck.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Question:
    category: str
    prompt: str
    options: list[str]
    correct_index: int
    explanation: str


QUIZ_BANK: list[Question] = [
    # -- workflow placement ------------------------------------------------
    Question(
        "Workflow",
        "After joining users to events, some users appear five times. What concept is this testing?",
        ["Join granularity (one-to-many joins)", "A primary key violation",
         "A failed LEFT JOIN", "Data leakage"],
        0,
        "A user with many events fans out to many rows on a one-to-many join. You must aggregate "
        "back to one row per user before modeling — this is the core of feature engineering.",
    ),
    Question(
        "Workflow",
        "You are investigating WHY retention dropped last week. Which analysis type is this?",
        ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"],
        1,
        "Explaining why something already happened is diagnostic analytics. Predicting what will "
        "happen is predictive; recommending an action is prescriptive.",
    ),
    Question(
        "Workflow",
        "You are predicting which users will return tomorrow. Which analysis type is this?",
        ["Descriptive", "Diagnostic", "Predictive", "Prescriptive"],
        2,
        "Forecasting a future outcome is predictive analytics — here a classification model for return/no-return.",
    ),
    Question(
        "Workflow",
        "Where does 'turn many event rows into one-row-per-user' sit in the workflow?",
        ["Visualization", "Feature engineering", "Model selection", "Deployment"],
        1,
        "Reshaping raw logs into a user-level feature matrix is feature engineering — it sits between EDA and modeling.",
    ),
    # -- SQL ---------------------------------------------------------------
    Question(
        "SQL",
        "You want ALL users, even those with no purchases. Which join?",
        ["INNER JOIN users → transactions", "LEFT JOIN users → transactions",
         "RIGHT JOIN users → transactions", "CROSS JOIN"],
        1,
        "A LEFT JOIN from users keeps every user row; non-purchasers get NULLs for transaction columns. "
        "An INNER JOIN would silently drop users who never bought anything.",
    ),
    Question(
        "SQL",
        "You want revenue by acquisition channel. What SQL pattern?",
        ["SELECT with WHERE only", "JOIN users→transactions, then GROUP BY acquisition_channel",
         "Two separate SELECTs", "ORDER BY acquisition_channel"],
        1,
        "Join the tables to bring channel and amount together, then GROUP BY channel and SUM the amount.",
    ),
    Question(
        "SQL",
        "You want each user's FIRST session timestamp. Which SQL concept helps most?",
        ["HAVING", "MIN(timestamp) grouped by user (or a window function)",
         "DISTINCT", "LIMIT 1"],
        1,
        "MIN(session_start) GROUP BY user_id gives the first session; window functions (ROW_NUMBER) "
        "generalize this to 'first N' or per-cohort ranking.",
    ),
    Question(
        "SQL",
        "WHERE filters rows; which clause filters AFTER a GROUP BY aggregation?",
        ["WHERE", "HAVING", "ORDER BY", "LIMIT"],
        1,
        "HAVING filters groups using aggregate conditions (e.g. HAVING COUNT(*) > 3). WHERE runs before grouping.",
    ),
    # -- visualization -----------------------------------------------------
    Question(
        "Visualization",
        "You want to compare D7 retention across acquisition channels. Best chart?",
        ["Scatter plot", "Bar chart (or cohort heatmap)", "Histogram", "Line chart"],
        1,
        "Comparing a metric across categories calls for a bar chart; a cohort heatmap works if you add a time dimension.",
    ),
    Question(
        "Visualization",
        "You want to see whether session duration predicts revenue. Best chart?",
        ["Pie chart", "Scatter plot", "Bar chart", "Box plot"],
        1,
        "Relationship between two numeric variables → scatter plot. Look for shape, trend, and outliers.",
    ),
    Question(
        "Visualization",
        "You want the spread and outliers of revenue by player type. Best chart?",
        ["Box plot", "Line chart", "Pie chart", "Heatmap"],
        0,
        "A box plot shows median, quartiles, and outliers per group — ideal for comparing distributions across categories.",
    ),
    Question(
        "Visualization",
        "You want to show how several numeric features correlate with each other. Best chart?",
        ["Stacked bar", "Correlation heatmap", "Histogram", "Line chart"],
        1,
        "A correlation heatmap shows all pairwise correlations at once — fast way to spot related features (and leakage).",
    ),
    # -- algorithm choice --------------------------------------------------
    Question(
        "Algorithm",
        "You want to predict D7 retention (yes/no). Which model family?",
        ["Regression", "Classification", "Clustering", "Dimensionality reduction"],
        1,
        "A categorical (binary) target means classification. Numeric target → regression; no target → clustering.",
    ),
    Question(
        "Algorithm",
        "You want to predict 30-day revenue (a dollar amount). Which model family?",
        ["Classification", "Regression", "Clustering", "PCA"],
        1,
        "A continuous numeric target is a regression problem (linear, tree, random-forest regressors).",
    ),
    Question(
        "Algorithm",
        "You want to find natural user segments with NO labels. Which model family?",
        ["Classification", "Regression", "Clustering", "Logistic regression"],
        2,
        "No target variable → unsupervised learning. K-means clusters users into behavioral segments.",
    ),
    Question(
        "Algorithm",
        "You need a simple, interpretable binary classifier with calibrated probabilities. First model to try?",
        ["Random forest", "Logistic regression", "SVM with RBF kernel", "K-means"],
        1,
        "Logistic regression is the standard interpretable baseline for binary problems and outputs probabilities "
        "you can threshold for product decisions.",
    ),
    Question(
        "Algorithm",
        "You want an explainable if/then rule a PM can read. Which model?",
        ["Decision tree", "Random forest", "SVM", "Naive Bayes"],
        0,
        "A single decision tree is a sequence of readable if/then splits. Forests are stronger but far less interpretable.",
    ),
    Question(
        "Algorithm",
        "You want a strong tabular baseline and don't need to explain every split. Which model?",
        ["KNN", "Naive Bayes", "Random forest", "Linear regression"],
        2,
        "Random forest is the go-to strong baseline for tabular data — many trees voting reduce overfitting versus one tree.",
    ),
    # -- metrics -----------------------------------------------------------
    Question(
        "Metrics",
        "False positives are expensive (you give a costly reward to users who'd stay anyway). Which metric matters more?",
        ["Recall", "Precision", "Accuracy", "RMSE"],
        1,
        "Precision = of those we flagged positive, how many truly were. Maximize it when acting on a positive is costly.",
    ),
    Question(
        "Metrics",
        "False negatives are expensive (you miss churners you could have saved). Which metric matters more?",
        ["Precision", "Recall", "Specificity", "R²"],
        1,
        "Recall = of the true positives, how many we caught. Maximize it when MISSING a positive is costly.",
    ),
    Question(
        "Metrics",
        "Accuracy looks suspiciously high on imbalanced classes. What should you inspect?",
        ["Only accuracy", "Confusion matrix, precision, recall, F1",
         "The learning rate", "The number of features"],
        1,
        "On imbalance, accuracy is misleading. The confusion matrix plus precision/recall/F1 reveal whether the "
        "minority class is actually being predicted.",
    ),
    Question(
        "Metrics",
        "You want regression error in the target's original units, punishing big misses. Which metric?",
        ["R²", "RMSE", "Accuracy", "Silhouette"],
        1,
        "RMSE is in the original units and squares errors, so large misses dominate. MAE is similar but treats misses equally.",
    ),
    Question(
        "Metrics",
        "Clusters look separated but you need a numeric score. Which metric?",
        ["Inertia only", "Silhouette score", "Accuracy", "ROC-AUC"],
        1,
        "Silhouette score (-1 to 1) measures cohesion vs separation. Inertia always falls with more clusters, so it can't "
        "pick k alone.",
    ),
    # -- failure modes -----------------------------------------------------
    Question(
        "Failure modes",
        "Train accuracy great, test accuracy poor. What's happening?",
        ["Underfitting", "Overfitting", "Leakage", "Drift"],
        1,
        "A big train-test gap means the model memorized the training set. Fix with more data, regularization, or a simpler model.",
    ),
    Question(
        "Failure modes",
        "Train AND test are both poor. What's happening?",
        ["Overfitting", "Underfitting", "Leakage", "Imbalance"],
        1,
        "Poor everywhere = the model is too simple or lacks signal. Add features/flexibility or reduce regularization.",
    ),
    Question(
        "Failure modes",
        "Your model scores 0.99 AUC offline but flops in production. Most likely cause?",
        ["Underfitting", "Data leakage", "Too few trees", "Wrong chart"],
        1,
        "Near-perfect offline scores usually mean a feature leaked future/target information that won't exist at predict time.",
    ),
]


def categories() -> list[str]:
    """Distinct quiz categories, for filtering in the UI."""
    return sorted({q.category for q in QUIZ_BANK})
