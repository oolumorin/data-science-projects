"""
05_Algorithm_Selector.py — a decision tree from "do you have a target?" to a
shortlist of models.

Educational purpose: model choice should follow from the *question and the data*,
not from hype. This page walks the same triage a working data scientist runs in
their head — labels? numeric or categorical target? what do you most need
(probabilities, explainability, a strong baseline)? — and lands on a small,
defensible shortlist, each shown as a full algorithm card.
"""

import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from src.ui import bootstrap, page_header, data_status_sidebar

import streamlit as st

from src.content import ALGORITHM_CARDS

# -- standard page setup -----------------------------------------------------
bootstrap("Algorithm Selector", icon="🧮")
data_status_sidebar()
page_header(
    "🧮 Algorithm Selector",
    "Answer a few questions about your **target** and your **priorities**, and get a "
    "shortlist of models to try — not one black box, but a defensible starting point.",
    stage="Model Selection",
)

# index the cards by name so we can pull the recommended ones quickly
CARDS = {c.name: c for c in ALGORITHM_CARDS}


def show_card(card, expanded: bool = True) -> None:
    """Render a single AlgorithmCard with all of its fields."""
    with st.expander(f"📇 {card.name}  ·  {card.family}", expanded=expanded):
        c1, c2 = st.columns(2)
        with c1:
            st.markdown(f"**Use when:** {card.use_when}")
            st.markdown(f"**Mental image:** {card.mental_image}")
            st.markdown(f"**Output:** {card.output}")
            st.markdown(f"**Good for:** {card.good_for}")
        with c2:
            st.markdown(f"**Weakness:** {card.weakness}")
            st.markdown(f"**Metrics:** {card.metrics}")
            st.markdown(f"**PM translation:** {card.pm_translation}")


# -- Q1: supervised or not? --------------------------------------------------
st.subheader("Q1 — Do you have a labeled target variable?")
q1 = st.radio(
    "A 'target' is the thing you want to predict, with known answers in your training data.",
    ["Yes — I have known outcomes to learn from", "No — I just have unlabeled data"],
    label_visibility="visible",
)
has_target = q1.startswith("Yes")

# the breadcrumb of choices, built up as we descend the tree
path = ["Target: Yes" if has_target else "Target: No"]
recommended: list[str] = []

if not has_target:
    # -- unsupervised branch -------------------------------------------------
    st.subheader("Q2 — What do you want from unlabeled data?")
    q2 = st.radio(
        "No labels means no prediction target — you're looking for structure.",
        ["Group similar users into segments", "Reduce many features to see the pattern"],
    )
    if q2.startswith("Group"):
        path.append("Find segments")
        recommended = ["K-Means Clustering"]
    else:
        path.append("Reduce dimensions")
        recommended = ["PCA"]

else:
    # -- supervised branch: numeric vs categorical target --------------------
    st.subheader("Q2 — Is the target numeric or categorical?")
    q2 = st.radio(
        "Numeric = 'how much / how many' (a number). Categorical = 'which class' (a label).",
        ["Numeric (a continuous number)", "Categorical (a class / label)"],
    )
    is_numeric = q2.startswith("Numeric")
    path.append("Numeric" if is_numeric else "Categorical")

    if is_numeric:
        # -- regression refinement -------------------------------------------
        st.subheader("Q3 — What best describes your regression problem?")
        q3 = st.radio(
            "This narrows the regression family.",
            [
                "Mostly linear relationship — want a simple baseline",
                "Correlated features causing unstable coefficients",
                "Many features — want automatic feature selection",
                "The relationship is curved, not straight",
                "Nonlinear if/then rules drive the outcome",
                "Just want the strongest tabular baseline",
            ],
        )
        reg_map = {
            "Mostly linear relationship — want a simple baseline": (["Linear Regression"], "Mostly linear → simple baseline"),
            "Correlated features causing unstable coefficients": (["Linear Regression"], "Correlated features → Ridge-style regularization (Linear family)"),
            "Many features — want automatic feature selection": (["Linear Regression"], "Feature selection → Lasso-style regularization (Linear family)"),
            "The relationship is curved, not straight": (["Linear Regression"], "Curved → Polynomial features (Linear family)"),
            "Nonlinear if/then rules drive the outcome": (["Decision Tree"], "Nonlinear rules → tree"),
            "Just want the strongest tabular baseline": (["Random Forest"], "Strong baseline → ensemble"),
        }
        recommended, leaf = reg_map[q3]
        path.append(leaf)
        if "regularization" in leaf or "Polynomial" in leaf:
            st.caption(
                "Ridge / Lasso / Polynomial are all variants of the **Linear Regression** "
                "family — same line-fitting idea, with regularization or expanded features. "
                "The Linear Regression card below covers the family."
            )

    else:
        # -- classification refinement ---------------------------------------
        st.subheader("Q3 — What do you most need from the classifier?")
        q3 = st.radio(
            "This narrows the classification family.",
            [
                "Calibrated probabilities for a threshold decision",
                "Explainable if/then rules",
                "A strong, accurate tabular baseline",
                "Predict from similar past examples",
                "A clean separating boundary in high dimensions",
            ],
        )
        clf_map = {
            "Calibrated probabilities for a threshold decision": (["Logistic Regression"], "Need probabilities → Logistic Regression"),
            "Explainable if/then rules": (["Decision Tree"], "Need explainability → Decision Tree"),
            "A strong, accurate tabular baseline": (["Random Forest"], "Need strong baseline → Random Forest"),
            "Predict from similar past examples": (["K-Nearest Neighbors"], "Need similarity → KNN"),
            "A clean separating boundary in high dimensions": (["Support Vector Machine"], "Need separation → SVM"),
        }
        recommended, leaf = clf_map[q3]
        path.append(leaf)

st.divider()

# -- the decision path as a breadcrumb ---------------------------------------
st.markdown("**Your decision path:**  " + "  →  ".join(f"`{step}`" for step in path))

# -- the recommendation ------------------------------------------------------
st.success("**Recommended model(s):** " + ", ".join(recommended), icon="✅")

st.subheader("Algorithm card(s) for your shortlist")
for name in recommended:
    if name in CARDS:
        show_card(CARDS[name], expanded=True)

# -- browse-all escape hatch -------------------------------------------------
st.divider()
with st.expander("📚 Browse all algorithm cards"):
    for card in ALGORITHM_CARDS:
        show_card(card, expanded=False)

st.info(
    "**Product framing:** matching the model to the decision matters more than squeezing out "
    "the last point of accuracy. If a PM needs to *explain* a flag to users, a decision tree "
    "that's 2% worse can beat a black box that's 'better'.",
    icon="💡",
)
