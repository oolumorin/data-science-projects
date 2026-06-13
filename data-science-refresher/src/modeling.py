"""
modeling.py — thin, consistent wrappers around scikit-learn estimators.

Educational purpose: every model in the app is trained the same way — split,
(optionally scale), fit, predict — so the learner sees the *workflow* clearly
rather than a tangle of one-off code. Functions return plain dicts of results so
Streamlit pages stay declarative.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import silhouette_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

RANDOM_STATE = 42


# ---------------------------------------------------------------------------
# classification
# ---------------------------------------------------------------------------
CLASSIFIERS = {
    "Logistic Regression": lambda: Pipeline(
        [("scale", StandardScaler()), ("clf", LogisticRegression(max_iter=1000))]
    ),
    "Decision Tree": lambda: DecisionTreeClassifier(max_depth=5, random_state=RANDOM_STATE),
    "Random Forest": lambda: RandomForestClassifier(
        n_estimators=200, max_depth=None, random_state=RANDOM_STATE, n_jobs=-1
    ),
}


@dataclass
class ClassificationResult:
    name: str
    model: object
    X_test: pd.DataFrame
    y_test: pd.Series
    y_pred: np.ndarray
    y_proba: np.ndarray | None
    feature_names: list[str]


def train_classifier(
    X: pd.DataFrame, y: pd.Series, model_name: str, test_size: float = 0.25
) -> ClassificationResult:
    """Split → fit → predict for one named classifier. Returns held-out results."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=RANDOM_STATE, stratify=y
    )
    model = CLASSIFIERS[model_name]()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None
    return ClassificationResult(
        name=model_name, model=model, X_test=X_test, y_test=y_test,
        y_pred=y_pred, y_proba=y_proba, feature_names=list(X.columns),
    )


def feature_importance(result: ClassificationResult) -> pd.DataFrame:
    """Pull importances (tree) or absolute coefficients (linear) for explanation."""
    model = result.model
    names = result.feature_names
    if hasattr(model, "feature_importances_"):
        imp = model.feature_importances_
    elif hasattr(model, "named_steps") and hasattr(model.named_steps.get("clf"), "coef_"):
        imp = np.abs(model.named_steps["clf"].coef_[0])
    elif hasattr(model, "coef_"):
        imp = np.abs(model.coef_[0])
    else:
        imp = np.zeros(len(names))
    return (
        pd.DataFrame({"feature": names, "importance": imp})
        .sort_values("importance", ascending=False)
        .reset_index(drop=True)
    )


# ---------------------------------------------------------------------------
# regression
# ---------------------------------------------------------------------------
@dataclass
class RegressionResult:
    name: str
    model: object
    X_test: np.ndarray
    y_test: np.ndarray
    y_pred: np.ndarray


def make_regressor(kind: str, degree: int = 2, max_depth: int = 5):
    """Factory for the three teaching regressors (linear / polynomial / tree)."""
    if kind == "Linear":
        return LinearRegression()
    if kind == "Polynomial":
        return Pipeline(
            [("poly", PolynomialFeatures(degree=degree)), ("lin", LinearRegression())]
        )
    if kind == "Decision Tree":
        return DecisionTreeRegressor(max_depth=max_depth, random_state=RANDOM_STATE)
    if kind == "Random Forest":
        return RandomForestRegressor(n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1)
    raise ValueError(f"Unknown regressor '{kind}'")


def train_regressor(
    X: np.ndarray, y: np.ndarray, kind: str, degree: int = 2,
    max_depth: int = 5, test_size: float = 0.25,
) -> RegressionResult:
    """Split → fit → predict for one regressor."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=RANDOM_STATE
    )
    model = make_regressor(kind, degree=degree, max_depth=max_depth)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    return RegressionResult(name=kind, model=model, X_test=X_test, y_test=y_test, y_pred=y_pred)


# ---------------------------------------------------------------------------
# clustering + PCA
# ---------------------------------------------------------------------------
@dataclass
class ClusterResult:
    k: int
    labels: np.ndarray
    centers_2d: np.ndarray
    coords_2d: np.ndarray
    silhouette: float
    inertia: float
    explained_variance: np.ndarray
    scaled: np.ndarray
    feature_names: list[str] = field(default_factory=list)


def run_kmeans_pca(X: pd.DataFrame, k: int) -> ClusterResult:
    """
    Scale → KMeans(k) → PCA(2D) so clusters can be both measured and *seen*.

    Educational purpose: clustering lives in high-dimensional space; PCA gives
    us an honest 2D map to look at it, with explained-variance as the caveat.
    """
    feature_names = list(X.columns)
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)

    km = KMeans(n_clusters=k, n_init=10, random_state=RANDOM_STATE)
    labels = km.fit_predict(Xs)

    pca = PCA(n_components=2, random_state=RANDOM_STATE)
    coords = pca.fit_transform(Xs)
    centers_2d = pca.transform(km.cluster_centers_)

    sil = silhouette_score(Xs, labels) if k > 1 else float("nan")
    return ClusterResult(
        k=k, labels=labels, centers_2d=centers_2d, coords_2d=coords,
        silhouette=sil, inertia=km.inertia_, explained_variance=pca.explained_variance_ratio_,
        scaled=Xs, feature_names=feature_names,
    )


def elbow_curve(X: pd.DataFrame, k_range=range(1, 9)) -> pd.DataFrame:
    """Inertia and silhouette across k — the data behind the elbow plot."""
    Xs = StandardScaler().fit_transform(X)
    rows = []
    for k in k_range:
        km = KMeans(n_clusters=k, n_init=10, random_state=RANDOM_STATE).fit(Xs)
        sil = silhouette_score(Xs, km.labels_) if k > 1 else np.nan
        rows.append({"k": k, "inertia": km.inertia_, "silhouette": sil})
    return pd.DataFrame(rows)


def cluster_profile(X: pd.DataFrame, labels: np.ndarray) -> pd.DataFrame:
    """Mean feature values per cluster — the 'who are these segments?' table."""
    prof = X.copy()
    prof["cluster"] = labels
    summary = prof.groupby("cluster").mean().round(2)
    summary.insert(0, "n_users", prof.groupby("cluster").size())
    return summary
