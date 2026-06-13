"""
visualizations.py — reusable Matplotlib figures with a consistent dark theme.

Educational purpose: charts ARE the teaching medium for a visual learner. Each
helper returns a Matplotlib Figure so Streamlit pages can render it with
st.pyplot() and stay focused on the lesson rather than plotting boilerplate.
"""

from __future__ import annotations

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.figure import Figure

# a calm dark palette that matches Streamlit's default dark theme
BG = "#0e1117"
FG = "#fafafa"
ACCENT = "#7aa2f7"
ACCENT2 = "#f7768e"
GOOD = "#9ece6a"
GRID = "#2a2e3a"
CLUSTER_COLORS = ["#7aa2f7", "#f7768e", "#9ece6a", "#e0af68", "#bb9af7", "#7dcfff", "#ff9e64", "#73daca"]


def _style(ax):
    """Apply the shared dark styling to an Axes."""
    ax.set_facecolor(BG)
    ax.tick_params(colors=FG, labelsize=9)
    for spine in ax.spines.values():
        spine.set_color(GRID)
    ax.xaxis.label.set_color(FG)
    ax.yaxis.label.set_color(FG)
    ax.title.set_color(FG)
    ax.grid(True, color=GRID, linewidth=0.5, alpha=0.6)


def _new_fig(w=6, h=4):
    fig = Figure(figsize=(w, h), facecolor=BG)
    ax = fig.add_subplot(111)
    _style(ax)
    return fig, ax


# ---------------------------------------------------------------------------
# classification visuals
# ---------------------------------------------------------------------------
def confusion_matrix_fig(counts: dict, labels=("Churned (0)", "Retained (1)")) -> Figure:
    """A 2x2 confusion matrix as an annotated heatmap."""
    m = np.array([[counts["tn"], counts["fp"]], [counts["fn"], counts["tp"]]])
    fig, ax = _new_fig(4.2, 3.8)
    ax.imshow(m, cmap="Blues", alpha=0.85)
    ax.set_xticks([0, 1], labels=[f"Pred {labels[0]}", f"Pred {labels[1]}"], fontsize=8)
    ax.set_yticks([0, 1], labels=[f"True {labels[0]}", f"True {labels[1]}"], fontsize=8)
    quad = [["TN", "FP"], ["FN", "TP"]]
    for i in range(2):
        for j in range(2):
            ax.text(j, i, f"{quad[i][j]}\n{m[i, j]}", ha="center", va="center",
                    color="#0e1117" if m[i, j] > m.max() / 2 else FG, fontsize=12, fontweight="bold")
    ax.grid(False)
    ax.set_title("Confusion Matrix")
    fig.tight_layout()
    return fig


def roc_fig(roc_df: pd.DataFrame, auc: float, current_threshold: float | None = None,
            y_true=None, y_proba=None) -> Figure:
    """ROC curve with the diagonal baseline; optionally mark the current threshold."""
    fig, ax = _new_fig(4.5, 4)
    ax.plot(roc_df["fpr"], roc_df["tpr"], color=ACCENT, lw=2, label=f"ROC (AUC={auc:.3f})")
    ax.plot([0, 1], [0, 1], color=ACCENT2, lw=1, ls="--", label="Chance")
    if current_threshold is not None and y_true is not None and y_proba is not None:
        y_pred = (np.asarray(y_proba) >= current_threshold).astype(int)
        tp = np.sum((y_pred == 1) & (np.asarray(y_true) == 1))
        fp = np.sum((y_pred == 1) & (np.asarray(y_true) == 0))
        p = np.sum(np.asarray(y_true) == 1)
        n = np.sum(np.asarray(y_true) == 0)
        ax.scatter([fp / max(n, 1)], [tp / max(p, 1)], color=GOOD, s=70, zorder=5,
                   label=f"threshold={current_threshold:.2f}")
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("ROC Curve")
    ax.legend(facecolor=BG, edgecolor=GRID, labelcolor=FG, fontsize=8)
    fig.tight_layout()
    return fig


def importance_fig(imp_df: pd.DataFrame, title="Feature Importance") -> Figure:
    """Horizontal bar chart of feature importances / coefficients."""
    d = imp_df.head(12).iloc[::-1]
    fig, ax = _new_fig(5.5, 4)
    ax.barh(d["feature"], d["importance"], color=ACCENT)
    ax.set_title(title)
    fig.tight_layout()
    return fig


# ---------------------------------------------------------------------------
# regression visuals
# ---------------------------------------------------------------------------
def regression_fit_fig(X, y, model, feature_idx=0, xlabel="x", ylabel="y") -> Figure:
    """Scatter of data with the fitted curve overlaid (1D view)."""
    fig, ax = _new_fig(5.5, 4)
    x = np.asarray(X)[:, feature_idx] if np.asarray(X).ndim > 1 else np.asarray(X)
    order = np.argsort(x)
    ax.scatter(x, y, color=ACCENT, alpha=0.5, s=18, label="data")
    grid = np.linspace(x.min(), x.max(), 200).reshape(-1, 1)
    try:
        ax.plot(grid.ravel(), model.predict(grid), color=ACCENT2, lw=2, label="fit")
    except Exception:
        ax.plot(x[order], np.asarray(model.predict(X))[order], color=ACCENT2, lw=2, label="fit")
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.set_title("Model Fit")
    ax.legend(facecolor=BG, edgecolor=GRID, labelcolor=FG, fontsize=8)
    fig.tight_layout()
    return fig


def actual_vs_predicted_fig(y_true, y_pred) -> Figure:
    """Actual-vs-predicted scatter with the perfect-prediction diagonal."""
    fig, ax = _new_fig(4.5, 4)
    ax.scatter(y_true, y_pred, color=ACCENT, alpha=0.5, s=18)
    lo, hi = float(np.min(y_true)), float(np.max(y_true))
    ax.plot([lo, hi], [lo, hi], color=ACCENT2, ls="--", lw=1)
    ax.set_xlabel("Actual")
    ax.set_ylabel("Predicted")
    ax.set_title("Actual vs Predicted")
    fig.tight_layout()
    return fig


def residuals_fig(y_true, y_pred) -> Figure:
    """Residuals vs predicted — should be a structureless cloud around zero."""
    fig, ax = _new_fig(4.5, 4)
    resid = np.asarray(y_true) - np.asarray(y_pred)
    ax.scatter(y_pred, resid, color=ACCENT, alpha=0.5, s=18)
    ax.axhline(0, color=ACCENT2, ls="--", lw=1)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Residual")
    ax.set_title("Residual Plot")
    fig.tight_layout()
    return fig


# ---------------------------------------------------------------------------
# clustering visuals
# ---------------------------------------------------------------------------
def cluster_scatter_fig(coords, labels, centers=None) -> Figure:
    """2D PCA scatter colored by cluster, with centroids marked."""
    fig, ax = _new_fig(5.5, 4.5)
    for c in np.unique(labels):
        pts = coords[labels == c]
        ax.scatter(pts[:, 0], pts[:, 1], s=14, alpha=0.6,
                   color=CLUSTER_COLORS[c % len(CLUSTER_COLORS)], label=f"Cluster {c}")
    if centers is not None:
        ax.scatter(centers[:, 0], centers[:, 1], marker="X", s=160,
                   color=FG, edgecolor="black", zorder=5, label="centroids")
    ax.set_xlabel("PC1")
    ax.set_ylabel("PC2")
    ax.set_title("User Segments (PCA 2D)")
    ax.legend(facecolor=BG, edgecolor=GRID, labelcolor=FG, fontsize=7, ncol=2)
    fig.tight_layout()
    return fig


def elbow_fig(elbow_df: pd.DataFrame) -> Figure:
    """Twin-axis elbow plot: inertia (drop) and silhouette (peak)."""
    fig, ax = _new_fig(5.5, 3.8)
    ax.plot(elbow_df["k"], elbow_df["inertia"], color=ACCENT, marker="o", label="inertia")
    ax.set_xlabel("k (number of clusters)")
    ax.set_ylabel("inertia", color=ACCENT)
    ax2 = ax.twinx()
    ax2.plot(elbow_df["k"], elbow_df["silhouette"], color=GOOD, marker="s", label="silhouette")
    ax2.set_ylabel("silhouette", color=GOOD)
    ax2.tick_params(colors=FG, labelsize=9)
    for spine in ax2.spines.values():
        spine.set_color(GRID)
    ax.set_title("Choosing k: elbow + silhouette")
    fig.tight_layout()
    return fig


# ---------------------------------------------------------------------------
# generic EDA chart examples (used by the Chart Chooser)
# ---------------------------------------------------------------------------
def example_chart(kind: str, df: pd.DataFrame) -> Figure:
    """Render a small example of each chart family on real product data."""
    fig, ax = _new_fig(5.5, 3.6)
    if kind == "bar":
        d = df.groupby("acquisition_channel")["retained_d7"].mean().sort_values()
        ax.bar(d.index, d.values, color=ACCENT)
        ax.set_title("D7 retention by acquisition channel")
        ax.tick_params(axis="x", rotation=30)
    elif kind == "line":
        d = df.groupby("signup_week").size()
        ax.plot(d.index, d.values, color=ACCENT, marker="o")
        ax.set_title("Signups per week (trend)")
    elif kind == "histogram":
        ax.hist(df["avg_session_duration"].clip(upper=2000), bins=30, color=ACCENT)
        ax.set_title("Distribution of avg session duration")
    elif kind == "box":
        groups = [g["total_revenue_30d"].values for _, g in df.groupby("player_type_seed")]
        ax.boxplot(groups, tick_labels=sorted(df["player_type_seed"].unique()))
        ax.set_title("Revenue spread by player type")
    elif kind == "scatter":
        ax.scatter(df["total_sessions_7d"], df["total_revenue_30d"], color=ACCENT, alpha=0.4, s=12)
        ax.set_xlabel("sessions (7d)")
        ax.set_ylabel("revenue (30d)")
        ax.set_title("Sessions vs revenue (relationship)")
    elif kind == "heatmap":
        cols = ["total_sessions_7d", "avg_session_duration", "purchases_7d",
                "revenue_7d", "event_diversity", "retained_d7"]
        corr = df[cols].corr()
        im = ax.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1)
        ax.set_xticks(range(len(cols)), labels=cols, rotation=45, ha="right", fontsize=7)
        ax.set_yticks(range(len(cols)), labels=cols, fontsize=7)
        ax.grid(False)
        fig.colorbar(im, ax=ax, fraction=0.046)
        ax.set_title("Correlation heatmap")
    elif kind == "stacked":
        ct = pd.crosstab(df["acquisition_channel"], df["churn_risk"], normalize="index")
        bottom = np.zeros(len(ct))
        for i, col in enumerate(["low", "medium", "high"]):
            if col in ct:
                ax.bar(ct.index, ct[col], bottom=bottom, label=col,
                       color=CLUSTER_COLORS[i])
                bottom += ct[col].values
        ax.set_title("Churn-risk composition by channel")
        ax.tick_params(axis="x", rotation=30)
        ax.legend(facecolor=BG, edgecolor=GRID, labelcolor=FG, fontsize=7)
    fig.tight_layout()
    return fig
