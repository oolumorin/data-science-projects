"""
07_Classification_Playground.py — predict D7 retention and tune the threshold.

Educational purpose: this is the heart of applied classification. A model outputs
a *probability*; YOU pick the threshold that turns it into an action — and that
choice trades precision against recall for a real product decision (who to target
with a retention campaign). The page makes that trade-off interactive: slide the
threshold and watch the confusion matrix, precision, and recall move in real time.
"""

import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from src.ui import bootstrap, page_header, data_status_sidebar

import streamlit as st

from src.feature_engineering import get_classification_xy
from src.modeling import CLASSIFIERS, train_classifier, feature_importance
from src.metrics import (
    classification_metrics,
    confusion_counts,
    metrics_from_threshold,
    roc_points,
    METRIC_EXPLANATIONS,
)
from src.visualizations import confusion_matrix_fig, roc_fig, importance_fig

# -- standard page setup -----------------------------------------------------
bootstrap("Classification Playground", icon="🎯")
data_status_sidebar()
page_header(
    "🎯 Classification Playground",
    "Predict **D7 retention** (will a new user still be active after 7 days?). Train a model, "
    "read the confusion matrix, then tune the **decision threshold** — the single most "
    "important interactive idea in classification.",
    stage="Evaluation",
)


# ---------------------------------------------------------------------------
# cached data + training (training one classifier per config)
# ---------------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def load_xy():
    """Cache the (X, y) classification matrix for D7 retention."""
    X, y, names = get_classification_xy("retained_d7")
    return X, y, names


@st.cache_resource(show_spinner=False)
def fit_model(model_name: str):
    """Train (and cache) one named classifier; returns held-out results."""
    X, y, _ = load_xy()
    return train_classifier(X, y, model_name)


# -- 1. choose + train the model --------------------------------------------
model_name = st.selectbox("Model", list(CLASSIFIERS.keys()), index=0)
result = fit_model(model_name)

# -- 2. headline metrics at the model's default 0.5 threshold ----------------
m = classification_metrics(result.y_test, result.y_pred, result.y_proba)
st.subheader("Model performance (default 0.5 threshold)")
cols = st.columns(5)
cols[0].metric("Accuracy", f"{m['accuracy']:.3f}")
cols[1].metric("Precision", f"{m['precision']:.3f}")
cols[2].metric("Recall", f"{m['recall']:.3f}")
cols[3].metric("F1", f"{m['f1']:.3f}")
cols[4].metric("ROC-AUC", f"{m.get('roc_auc', float('nan')):.3f}")

# -- 3. confusion matrix + ROC side by side ----------------------------------
v1, v2 = st.columns(2)
with v1:
    st.pyplot(confusion_matrix_fig(confusion_counts(result.y_test, result.y_pred)))
with v2:
    if result.y_proba is not None:
        roc_df = roc_points(result.y_test, result.y_proba)
        st.pyplot(roc_fig(roc_df, m.get("roc_auc", float("nan"))))
    else:
        st.info("This model exposes no probabilities, so there's no ROC curve.")

st.divider()

# -- 4. THE threshold lesson -------------------------------------------------
st.subheader("⚖️ The threshold trade-off — the core lesson")
st.markdown(
    "The model gives each user a **probability of retaining**. The threshold decides who we "
    "*act* on. Slide it and watch precision and recall move in opposite directions."
)

if result.y_proba is not None:
    threshold = st.slider("Decision threshold", 0.05, 0.95, 0.50, 0.01)
    tm = metrics_from_threshold(result.y_test, result.y_proba, threshold)

    tcols = st.columns(4)
    tcols[0].metric("Precision", f"{tm['precision']:.3f}")
    tcols[1].metric("Recall", f"{tm['recall']:.3f}")
    tcols[2].metric("F1", f"{tm['f1']:.3f}")
    tcols[3].metric("Accuracy", f"{tm['accuracy']:.3f}")

    tv1, tv2 = st.columns(2)
    with tv1:
        st.pyplot(confusion_matrix_fig(
            {"tn": tm["tn"], "fp": tm["fp"], "fn": tm["fn"], "tp": tm["tp"]}
        ))
    with tv2:
        st.pyplot(roc_fig(
            roc_points(result.y_test, result.y_proba),
            m.get("roc_auc", float("nan")),
            current_threshold=threshold,
            y_true=result.y_test,
            y_proba=result.y_proba,
        ))

    st.success(
        "**Raise the threshold to be precise** — only act on very-likely retainers (fewer false "
        "alarms, but you miss some). **Lower it for recall** — catch more true retainers at the "
        "cost of acting on some who'd churn anyway. There is no free lunch; pick the side the "
        "business cares about.",
        icon="⚖️",
    )
else:
    st.warning(
        "This model doesn't output probabilities, so the threshold slider doesn't apply. "
        "Try **Logistic Regression** to see the trade-off most clearly.",
        icon="ℹ️",
    )

st.divider()

# -- 5. what drives retention ------------------------------------------------
st.subheader("What drives retention?")
imp = feature_importance(result)
ic1, ic2 = st.columns([1.3, 1])
with ic1:
    title = "Feature importance" if hasattr(result.model, "feature_importances_") else "|Coefficient| (importance)"
    st.pyplot(importance_fig(imp, title=title))
with ic2:
    st.markdown("**Top signals:**")
    for _, row in imp.head(5).iterrows():
        st.caption(f"`{row['feature']}` — {row['importance']:.3f}")
    st.caption(
        "Behaviors like tutorial completion, early session activity, and event diversity "
        "tend to dominate — onboarding leaves a fingerprint."
    )

with st.expander("Metric glossary"):
    for key in ["precision", "recall", "f1", "roc_auc", "accuracy"]:
        st.markdown(f"- **{key}** — {METRIC_EXPLANATIONS[key]}")

# -- 6. PM framing -----------------------------------------------------------
st.info(
    "**PM decision:** suppose you have budget to send a retention nudge to 1,000 users. Use the "
    "model's probabilities to rank them, then set the threshold by your budget and goal — "
    "**high threshold** if the incentive is expensive (be precise), **lower threshold** if "
    "missing a churnable user is the bigger loss (favor recall).",
    icon="🧭",
)
