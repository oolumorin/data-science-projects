"""
09_Metrics_Simulator.py — build intuition for every evaluation metric by moving
sliders and watching the numbers (and the confusion matrix) respond.

Educational purpose: a metric only teaches once you've *felt* it move. Here you
slide a classification threshold and watch precision trade against recall; you
inject noise into a regression and watch RMSE punish big misses harder than MAE;
and you read train/test scores as a diagnostic for the classic failure modes.
All synthetic data is generated in-page with a fixed seed so the lesson is
reproducible and self-contained.
"""

import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from src.ui import bootstrap, page_header, data_status_sidebar

import numpy as np
import pandas as pd
import streamlit as st

from src.metrics import (
    METRIC_EXPLANATIONS,
    FAILURE_MODES,
    metrics_from_threshold,
    regression_metrics,
    roc_points,
)
from src.visualizations import (
    confusion_matrix_fig,
    roc_fig,
    residuals_fig,
    actual_vs_predicted_fig,
)

# -- standard page setup -----------------------------------------------------
bootstrap("Metrics Simulator", icon="🎯")
data_status_sidebar()
page_header(
    "🎯 Metrics Simulator",
    "Every metric is an interactive here. Move the sliders and watch precision, recall, "
    "RMSE and friends respond — that's how the definitions actually stick.",
    stage="Evaluation",
)

tab_clf, tab_reg, tab_clu, tab_fail = st.tabs(
    ["Classification", "Regression", "Clustering", "Failure modes"]
)


# ---------------------------------------------------------------------------
# Classification tab — threshold-based confusion-matrix simulator
# ---------------------------------------------------------------------------
with tab_clf:
    st.subheader("Threshold simulator")
    st.markdown(
        "The model outputs a **probability**; *you* pick the threshold that turns it into a "
        "yes/no. Slide it and watch the confusion matrix counts flow between quadrants."
    )

    # synthetic, reproducible: ~40% positive, probabilities correlated with truth
    rng = np.random.default_rng(42)
    n = 200
    y_true = (rng.random(n) < 0.40).astype(int)
    # signal (y shifts the mean) + noise, squashed into [0, 1]
    y_proba = np.clip(0.30 + 0.45 * y_true + rng.normal(0, 0.20, n), 0.001, 0.999)

    threshold = st.slider("Decision threshold", 0.0, 1.0, 0.50, 0.01)
    m = metrics_from_threshold(y_true, y_proba, threshold)

    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Precision", f"{m['precision']:.3f}")
    c2.metric("Recall", f"{m['recall']:.3f}")
    c3.metric("F1", f"{m['f1']:.3f}")
    c4.metric("Accuracy", f"{m['accuracy']:.3f}")
    c5.metric("ROC-AUC", f"{m.get('roc_auc', float('nan')):.3f}")

    st.caption(
        f"Counts at threshold {threshold:.2f} →  "
        f"TP={m['tp']}  ·  FP={m['fp']}  ·  FN={m['fn']}  ·  TN={m['tn']}.  "
        "Raise the threshold and you flag fewer users: FP and TP fall (precision up, recall down)."
    )

    g1, g2 = st.columns(2)
    with g1:
        st.pyplot(confusion_matrix_fig(m))
    with g2:
        roc_df = roc_points(y_true, y_proba)
        auc = float(m.get("roc_auc", float("nan")))
        st.pyplot(roc_fig(roc_df, auc, current_threshold=threshold,
                          y_true=y_true, y_proba=y_proba))

    st.markdown("**Precision vs recall — the trade you're actually making:**")
    pr1, pr2 = st.columns(2)
    pr1.info("Tune for **recall** when a *false negative* is costly — e.g. **missing a churner** "
             "you could have saved.", icon="🎯")
    pr2.info("Tune for **precision** when a *false positive* is costly — e.g. **burning a "
             "retention incentive** on someone who'd have stayed anyway.", icon="💸")

    st.markdown("**What each number means:**")
    for key in ["precision", "recall", "f1", "accuracy", "roc_auc"]:
        st.markdown(f"- **{key}** — {METRIC_EXPLANATIONS[key]}")


# ---------------------------------------------------------------------------
# Regression tab — toy fit, noise slider, MAE/RMSE/R²
# ---------------------------------------------------------------------------
with tab_reg:
    st.subheader("Error metrics under noise")
    st.markdown(
        "Generate a toy linear relationship, then **inject noise** and watch MAE, RMSE and R² "
        "respond. Notice RMSE pulls away from MAE as big misses appear."
    )

    rng = np.random.default_rng(7)
    n = 200
    x = np.linspace(0, 10, n)
    y_true = 3.0 * x + 5.0  # the clean signal

    noise = st.slider("Noise level (σ)", 0.0, 15.0, 3.0, 0.5)
    # prediction = clean signal + gaussian noise (stands in for model error)
    y_pred = y_true + rng.normal(0, noise, n)

    rm = regression_metrics(y_true, y_pred)
    r1, r2, r3 = st.columns(3)
    r1.metric("MAE", f"{rm['mae']:.2f}")
    r2.metric("RMSE", f"{rm['rmse']:.2f}")
    r3.metric("R²", f"{rm['r2']:.3f}")

    st.caption(
        "RMSE ≥ MAE always, and the gap widens with big outliers because RMSE squares the "
        "errors first. Crank the noise and watch RMSE outrun MAE while R² collapses toward 0."
    )

    g1, g2 = st.columns(2)
    with g1:
        st.pyplot(actual_vs_predicted_fig(y_true, y_pred))
    with g2:
        st.pyplot(residuals_fig(y_true, y_pred))

    st.markdown("**What each number means:**")
    for key in ["mae", "rmse", "r2"]:
        st.markdown(f"- **{key}** — {METRIC_EXPLANATIONS[key]}")


# ---------------------------------------------------------------------------
# Clustering tab — silhouette + inertia on a real K-means run
# ---------------------------------------------------------------------------
with tab_clu:
    st.subheader("Clustering quality: silhouette + inertia")
    st.markdown(METRIC_EXPLANATIONS["silhouette"])
    st.markdown(
        "Unlike classification, there's no label to grade against — so we measure *internal* "
        "quality: are clusters tight (**inertia**) and well-separated (**silhouette**)?"
    )

    k = st.slider("k (number of clusters)", 2, 8, 4, 1)
    try:
        from src.feature_engineering import get_classification_xy
        from src.modeling import run_kmeans_pca

        X, _y, _names = get_classification_xy()
        res = run_kmeans_pca(X, k)
        m1, m2 = st.columns(2)
        m1.metric("Silhouette", f"{res.silhouette:.3f}", help="Higher = tighter, better-separated. Range -1..1.")
        m2.metric("Inertia", f"{res.inertia:,.0f}", help="Within-cluster sum of squares. Always falls as k rises.")
        st.caption(
            "Inertia always drops as you add clusters, so it can't pick k alone — look for the "
            "**elbow**. Silhouette can actually peak, making it the better single guide to k."
        )
    except Exception as exc:  # keep the lesson conceptual if the model run fails
        st.info(
            "Silhouette ranges -1 to 1 (higher is better-separated); inertia is the "
            "within-cluster sum of squares and always falls as k rises — so use the elbow "
            "for inertia and the peak for silhouette.",
            icon="🧩",
        )
        st.caption(f"(Live K-means run unavailable: {exc})")


# ---------------------------------------------------------------------------
# Failure modes tab — read train/test scores, diagnose, fix
# ---------------------------------------------------------------------------
with tab_fail:
    st.subheader("Diagnose from your train/test scores")
    st.markdown(
        "Most modeling problems show up as a **pattern** across your training and test scores. "
        "Read the pattern, name the failure, apply the fix."
    )
    st.table(
        pd.DataFrame(FAILURE_MODES).rename(
            columns={"pattern": "Pattern (train vs test)", "diagnosis": "Diagnosis", "fix": "Fix"}
        )
    )
    st.info(
        "**Product framing:** a model that looks perfect offline but is secretly leaking (or "
        "will drift in production) is worse than an honest mediocre one — it ships confident "
        "wrong decisions.",
        icon="💡",
    )
