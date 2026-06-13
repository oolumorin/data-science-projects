"""
metrics.py — evaluation metrics plus plain-English interpretation helpers.

Educational purpose: a number like "F1 = 0.71" only teaches if you know what it
means and when to care. Each function returns the metric AND a short, honest
explanation so the Metrics Simulator and model pages can show both.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)


# ---------------------------------------------------------------------------
# classification
# ---------------------------------------------------------------------------
def classification_metrics(y_true, y_pred, y_proba=None) -> dict:
    """Bundle the core classification metrics into one dict."""
    out = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
    }
    if y_proba is not None and len(np.unique(y_true)) > 1:
        out["roc_auc"] = roc_auc_score(y_true, y_proba)
    return out


def confusion_counts(y_true, y_pred) -> dict:
    """Return TN/FP/FN/TP as named ints (clearer than a raw 2x2 array)."""
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    return {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}


def metrics_from_threshold(y_true, y_proba, threshold: float) -> dict:
    """
    Apply a probability threshold and recompute everything.

    Educational purpose: this is the single most important interactive idea in
    classification — the model outputs probabilities, and *you* choose the
    threshold that trades precision against recall for the product decision.
    """
    y_pred = (np.asarray(y_proba) >= threshold).astype(int)
    counts = confusion_counts(y_true, y_pred)
    m = classification_metrics(y_true, y_pred, y_proba)
    return {**m, **counts, "threshold": threshold}


def roc_points(y_true, y_proba) -> pd.DataFrame:
    """FPR/TPR/threshold points for drawing the ROC curve."""
    fpr, tpr, thr = roc_curve(y_true, y_proba)
    return pd.DataFrame({"fpr": fpr, "tpr": tpr, "threshold": thr})


# ---------------------------------------------------------------------------
# regression
# ---------------------------------------------------------------------------
def regression_metrics(y_true, y_pred) -> dict:
    """MAE / RMSE / R² — error in original units plus variance explained."""
    mae = mean_absolute_error(y_true, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = r2_score(y_true, y_pred)
    return {"mae": mae, "rmse": rmse, "r2": r2}


# ---------------------------------------------------------------------------
# plain-English glossary (used by the Metrics Simulator)
# ---------------------------------------------------------------------------
METRIC_EXPLANATIONS = {
    "accuracy": (
        "Share of all predictions that were correct. Trustworthy only when "
        "classes are balanced — 95% accuracy is meaningless if 95% of users retain."
    ),
    "precision": (
        "Of the users we *flagged* as positive, how many really were. "
        "Care about precision when a false positive is costly (e.g. spending a "
        "retention incentive on someone who'd have stayed anyway)."
    ),
    "recall": (
        "Of the users who really were positive, how many we *caught*. "
        "Care about recall when a false negative is costly (e.g. missing a "
        "churner you could have saved)."
    ),
    "f1": (
        "Harmonic mean of precision and recall — one number when you need a "
        "balance between the two and the classes are uneven."
    ),
    "roc_auc": (
        "Probability the model ranks a random positive above a random negative. "
        "0.5 is coin-flip, 1.0 is perfect. Measures ranking quality, independent "
        "of any single threshold."
    ),
    "mae": (
        "Mean Absolute Error — average miss in the target's own units (e.g. "
        "dollars). Easy to explain; treats all misses equally."
    ),
    "rmse": (
        "Root Mean Squared Error — like MAE but squares errors first, so it "
        "punishes large misses harder. Same units as the target."
    ),
    "r2": (
        "Proportion of variance the model explains. 1.0 is perfect, 0 is no "
        "better than predicting the mean, negative is worse than the mean."
    ),
    "silhouette": (
        "How well each point sits in its cluster vs the nearest other cluster. "
        "Ranges -1 to 1; higher means tighter, better-separated clusters."
    ),
}


FAILURE_MODES = [
    {"pattern": "Train bad + test bad", "diagnosis": "Underfitting",
     "fix": "More features, a more flexible model, less regularization."},
    {"pattern": "Train great + test bad", "diagnosis": "Overfitting",
     "fix": "More data, regularization, simpler model, cross-validation."},
    {"pattern": "Both suspiciously perfect", "diagnosis": "Leakage",
     "fix": "Hunt for a feature that encodes the future/target. Remove it."},
    {"pattern": "High accuracy, low recall", "diagnosis": "Class imbalance",
     "fix": "Look at the confusion matrix; use F1/AUC; resample or reweight."},
    {"pattern": "Great offline, bad in production", "diagnosis": "Drift",
     "fix": "Retrain on fresh data; monitor inputs; check train/serve skew."},
]
