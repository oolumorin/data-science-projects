"""
content.py — the teaching copy: workflow stages, algorithm cards, chart and
algorithm decision logic.

Educational purpose: keeping the *content* (what each stage/algorithm/chart is
and when to use it) in one structured place means every page renders the same
vocabulary, and adding a new card is a one-line data edit — not a code change.
"""

from __future__ import annotations

from dataclasses import dataclass

# ---------------------------------------------------------------------------
# 1. the master workflow map
# ---------------------------------------------------------------------------
@dataclass
class Stage:
    name: str
    what: str          # what happens here
    tools: str         # tools used
    mistakes: str      # common mistakes
    output: str        # what this stage produces
    product: str       # how it connects to a product decision


WORKFLOW_STAGES: list[Stage] = [
    Stage("Business / Product Question",
          "Frame the decision you actually need to make.",
          "Stakeholder conversations, a one-line problem statement.",
          "Jumping to data before the question is sharp; vague success criteria.",
          "A precise, answerable question with a success metric.",
          "Everything downstream optimizes this question — get it wrong and the rest is wasted."),
    Stage("Data Sources",
          "Identify what data could answer the question and where it lives.",
          "Data catalogs, schema docs, tracking plans.",
          "Assuming the data exists; ignoring how events are logged.",
          "A list of tables/feeds and their grain (per-user? per-event?).",
          "Tells you whether the question is answerable at all with current instrumentation."),
    Stage("SQL / APIs / CSVs / Scraping",
          "Pull the raw data into your workspace.",
          "SQL, SQLite, requests, pandas.read_sql / read_csv.",
          "One-to-many joins that silently duplicate rows; wrong join type.",
          "Raw extracted tables (users, events, transactions).",
          "The factual substrate; mistakes here corrupt every later number."),
    Stage("Data Cleaning",
          "Fix missing values, duplicates, wrong types, impossible values.",
          "pandas: dropna/fillna, astype, deduplication.",
          "Imputing blindly; deleting rows that carry signal; ignoring outliers.",
          "A trustworthy, correctly-typed dataset.",
          "Garbage in, garbage out — clean data is the cheapest accuracy you'll ever buy."),
    Stage("Data Wrangling",
          "Reshape, merge, and pivot data into the grain you need.",
          "pandas merge/groupby/pivot, SQL CTEs.",
          "Losing rows on merges; aggregating at the wrong grain.",
          "A tidy table at the right unit of analysis (one row per user).",
          "Determines what questions you can even ask of the data."),
    Stage("Exploratory Data Analysis",
          "Look before you model — distributions, comparisons, relationships.",
          "describe(), value_counts(), groupby, quick charts.",
          "Skipping EDA; trusting summary stats without plotting (Anscombe).",
          "Hypotheses about what drives the outcome.",
          "Surfaces the patterns and surprises a PM needs to know about."),
    Stage("Visualization",
          "Turn patterns into pictures that communicate.",
          "Matplotlib, Seaborn, Plotly.",
          "Wrong chart for the question; misleading axes; pie charts everywhere.",
          "Charts that make the pattern obvious to non-analysts.",
          "How the insight actually reaches decision-makers."),
    Stage("Feature Engineering",
          "Convert raw logs into model-ready signals (X matrix).",
          "groupby aggregations, encodings, scaling.",
          "Leakage — using post-outcome information as a feature.",
          "A user-level feature matrix aligned to the target.",
          "Good features beat fancy models; this is where domain knowledge pays off."),
    Stage("Model Selection",
          "Choose the model family that fits the question and target.",
          "The algorithm selector: target? numeric/categorical? labels?",
          "Reaching for deep learning when logistic regression suffices.",
          "A shortlist of candidate models to train.",
          "Matches the tool to the decision and the explainability you need."),
    Stage("Training",
          "Fit candidate models on a training split.",
          "scikit-learn fit(); train_test_split; cross-validation.",
          "Training on the test set; not setting a random seed.",
          "Fitted models ready to evaluate.",
          "The mechanical step — cheap once features and split are right."),
    Stage("Evaluation",
          "Measure honestly on held-out data with the right metric.",
          "confusion matrix, precision/recall/F1, ROC-AUC, RMSE, R².",
          "Optimizing accuracy on imbalanced data; ignoring business cost.",
          "Metrics that map to the product decision.",
          "Decides whether the model is good enough to act on."),
    Stage("Interpretation",
          "Explain WHY the model predicts what it does.",
          "Feature importance, coefficients, partial dependence.",
          "Confusing correlation with causation; over-trusting one number.",
          "A narrative a stakeholder can believe and act on.",
          "Turns a black box into a decision a team will actually adopt."),
    Stage("Dashboard / PM Memo / Decision",
          "Ship the insight as a decision or a monitored metric.",
          "Streamlit/dashboards, a written recommendation memo.",
          "A model that never ships; no monitoring for drift.",
          "An action, a rollout, or a tracked KPI.",
          "The whole point — analysis that changes what the product does."),
]


# ---------------------------------------------------------------------------
# 2. question-type → method map (Module 1 interaction)
# ---------------------------------------------------------------------------
QUESTION_TYPES = {
    "What happened?": {
        "analytics": "Descriptive",
        "methods": "Aggregations, value_counts, dashboards",
        "charts": "Bar, line, KPI tiles",
        "models": "None — summarize, don't predict",
    },
    "Why did it happen?": {
        "analytics": "Diagnostic",
        "methods": "Segmentation, correlation, cohort comparison",
        "charts": "Heatmap, grouped bar, scatter",
        "models": "Correlation analysis, simple regressions",
    },
    "What will happen?": {
        "analytics": "Predictive",
        "methods": "Train/test, supervised learning",
        "charts": "ROC, actual-vs-predicted",
        "models": "Regression (numeric), classification (categorical)",
    },
    "What should we do?": {
        "analytics": "Prescriptive",
        "methods": "Optimization, uplift, simulation",
        "charts": "Decision curves, what-if sliders",
        "models": "Optimization, recommendation, uplift models",
    },
}


# ---------------------------------------------------------------------------
# 3. chart chooser
# ---------------------------------------------------------------------------
CHART_RECOMMENDATIONS = {
    "Comparison": {"chart": "Bar chart", "kind": "bar",
                   "why": "Compare a metric across discrete categories.",
                   "antipattern": "Avoid pie charts for comparison — lengths beat angles for the eye."},
    "Trend": {"chart": "Line chart", "kind": "line",
              "why": "Show how a value changes over time.",
              "antipattern": "Don't use a bar chart for a continuous time series."},
    "Distribution": {"chart": "Histogram / box plot", "kind": "histogram",
                     "why": "Reveal spread, skew, and outliers of one variable.",
                     "antipattern": "A single mean hides the shape — always look at the distribution."},
    "Relationship": {"chart": "Scatter plot", "kind": "scatter",
                     "why": "See how two numeric variables move together.",
                     "antipattern": "Don't infer causation from a scatter — correlation only."},
    "Correlation": {"chart": "Heatmap", "kind": "heatmap",
                    "why": "Compare many pairwise correlations at once.",
                    "antipattern": "A strong correlation can be leakage — sanity-check suspicious 0.99s."},
    "Geography": {"chart": "Map / choropleth", "kind": "bar",
                  "why": "Show a metric varying across regions.",
                  "antipattern": "Raw counts mislead — normalize by population/users."},
    "Composition": {"chart": "Stacked bar / treemap", "kind": "stacked",
                    "why": "Show parts of a whole across groups.",
                    "antipattern": "Too many segments become unreadable — group small ones into 'other'."},
}


# ---------------------------------------------------------------------------
# 4. algorithm cards
# ---------------------------------------------------------------------------
@dataclass
class AlgorithmCard:
    name: str
    family: str
    use_when: str
    mental_image: str
    output: str
    good_for: str
    weakness: str
    metrics: str
    pm_translation: str


ALGORITHM_CARDS: list[AlgorithmCard] = [
    AlgorithmCard("Linear Regression", "Regression", "Target is a continuous number",
                  "Draw the best-fit line through the points", "A predicted number",
                  "price, revenue, demand, duration", "Assumes a mostly linear relationship",
                  "MAE, RMSE, R²", "Simple, explainable baseline for 'how much?'"),
    AlgorithmCard("Logistic Regression", "Classification", "Target is binary",
                  "A boundary that turns distance into a probability", "Probability 0–1",
                  "churn, conversion, D7 retention", "Linear decision boundary",
                  "precision, recall, F1, ROC-AUC", "Great for threshold-based product decisions"),
    AlgorithmCard("K-Nearest Neighbors", "Classification / Regression",
                  "Similar examples should have similar outcomes", "Nearby points vote",
                  "Class or average value", "intuitive similarity problems",
                  "Slow on big data; scaling matters", "classification/regression metrics",
                  "Good mental model for recommendation and segmentation"),
    AlgorithmCard("Decision Tree", "Classification / Regression", "You want explainable rules",
                  "A sequence of if/then splits", "Class or number",
                  "explainable product rules", "Overfits easily", "accuracy/F1 or RMSE/R²",
                  "Great for explaining WHY a prediction happened"),
    AlgorithmCard("Random Forest", "Ensemble", "You want a strong tabular baseline",
                  "Many trees vote together", "Class, probability, or number",
                  "tabular prediction", "Less interpretable than one tree",
                  "classification/regression metrics", "Good default when accuracy beats simplicity"),
    AlgorithmCard("Support Vector Machine", "Classification", "You need a separating boundary",
                  "Widest possible margin between classes", "Class",
                  "high-dimensional classification", "Tuning and interpretation are harder",
                  "accuracy, F1, ROC-AUC", "Useful when separation matters, less for plain explanation"),
    AlgorithmCard("Naive Bayes", "Probabilistic classification", "Features add up as evidence",
                  "Add up the clues", "Class probability", "spam, text, simple baselines",
                  "Assumes features are independent", "accuracy, precision, recall, F1",
                  "Strong simple baseline for text or categorical signals"),
    AlgorithmCard("K-Means Clustering", "Unsupervised", "You want simple segments",
                  "Find K cluster centers", "Cluster assignment", "user/customer segmentation",
                  "Must choose K; assumes round-ish clusters", "inertia, silhouette",
                  "Segment users into behavioral groups"),
    AlgorithmCard("PCA", "Dimensionality reduction", "Too many features to see the pattern",
                  "Rotate the data onto its most informative axes", "Fewer components",
                  "compression, visualization, denoising", "Components are less intuitive",
                  "explained variance", "Visualize complex user behavior in 2D"),
    AlgorithmCard("Gradient Boosting", "Ensemble", "You want high tabular performance",
                  "Each new tree corrects the last tree's mistakes", "Class, probability, or number",
                  "strong prediction tasks", "Can overfit; less intuitive",
                  "classification/regression metrics", "Powerful production model — evaluate carefully"),
]
