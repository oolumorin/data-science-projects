"""
10_Mini_Capstone.py — the full applied project, end to end, in one page.

Educational purpose: every other page drills ONE stage of the workflow. This is
where the learner walks the WHOLE system once — product question → SQL → cleaning
→ features → EDA → models → evaluation → a written PM decision — and sees how the
pieces connect into a single narrative that turns data into an action. The final
memo is auto-populated with the REAL numbers computed on the page, so the payoff
(analysis → decision) is concrete, not hypothetical.
"""

import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from src.ui import bootstrap, page_header, data_status_sidebar

import pandas as pd
import streamlit as st

from src.db import run_query, load_table, table_overview, TABLES
from src.feature_engineering import (
    build_user_features,
    build_eda_frame,
    get_classification_xy,
    get_regression_xy,
    FEATURE_COLUMNS,
)
from src.modeling import (
    train_classifier,
    feature_importance,
    train_regressor,
    run_kmeans_pca,
    cluster_profile,
)
from src.metrics import classification_metrics, confusion_counts, regression_metrics
from src.visualizations import (
    confusion_matrix_fig,
    importance_fig,
    actual_vs_predicted_fig,
    cluster_scatter_fig,
    example_chart,
)

# -- standard page setup -----------------------------------------------------
bootstrap("Mini-Capstone", icon="🏁")
data_status_sidebar()
page_header(
    "🏁 Mini-Capstone — the full applied project",
    "One product question, walked through the **entire** workflow: SQL → cleaning → "
    "features → EDA → a classifier, a regressor, and a clustering model → an honest "
    "evaluation → a **PM recommendation memo built from the real numbers below**. "
    "Use the step selector in the sidebar to move through the 12 steps.",
    stage="All stages — the complete project",
)


# ---------------------------------------------------------------------------
# cached heavy lifting — features + the three trained models live here so the
# page stays snappy and the final memo can reuse the same fitted results.
# ---------------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def load_features() -> pd.DataFrame:
    """Per-user feature matrix (one row per user)."""
    return build_user_features()


@st.cache_data(show_spinner=False)
def load_eda() -> pd.DataFrame:
    """Modeling frame + user attributes for slicing in EDA."""
    return build_eda_frame()


@st.cache_resource(show_spinner=False)
def train_d7_rf():
    """Train the D7-retention Random Forest once and cache the fitted result."""
    X, y, _ = get_classification_xy("retained_d7")
    res = train_classifier(X, y, "Random Forest")
    metrics = classification_metrics(res.y_test, res.y_pred, res.y_proba)
    counts = confusion_counts(res.y_test, res.y_pred)
    imp = feature_importance(res)
    return res, metrics, counts, imp


@st.cache_resource(show_spinner=False)
def train_revenue_rf():
    """Train the 30-day revenue Random Forest regressor once."""
    X, y, _ = get_regression_xy("total_revenue_30d")
    res = train_regressor(X.to_numpy(), y.to_numpy(), "Random Forest")
    metrics = regression_metrics(res.y_test, res.y_pred)
    return res, metrics


@st.cache_resource(show_spinner=False)
def run_clustering(k: int = 4):
    """K-means + PCA on the feature matrix; cache the result + profile."""
    X, _, _ = get_classification_xy("retained_d7")
    cl = run_kmeans_pca(X, k)
    profile = cluster_profile(X, cl.labels)
    return cl, profile


@st.cache_data(show_spinner=False)
def compare_classifiers() -> pd.DataFrame:
    """Train three classifiers for D7 and tabulate held-out metrics."""
    X, y, _ = get_classification_xy("retained_d7")
    rows = []
    for name in ["Logistic Regression", "Decision Tree", "Random Forest"]:
        r = train_classifier(X, y, name)
        m = classification_metrics(r.y_test, r.y_pred, r.y_proba)
        rows.append({
            "model": name,
            "accuracy": m.get("accuracy"),
            "precision": m.get("precision"),
            "recall": m.get("recall"),
            "f1": m.get("f1"),
            "roc_auc": m.get("roc_auc"),
        })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# step selector (sidebar) — keeps the page navigable as a guided sequence
# ---------------------------------------------------------------------------
STEPS = [
    "1 · Frame the product question",
    "2 · Inspect the tables",
    "3 · SQL-style joins",
    "4 · Cleaning",
    "5 · Feature engineering",
    "6 · EDA",
    "7 · Visualize key relationships",
    "8 · D7 retention classifier",
    "9 · 30-day revenue regressor",
    "10 · User clustering",
    "11 · Model evaluation",
    "12 · PM recommendation memo",
]

with st.sidebar:
    st.markdown("### 🏁 Capstone steps")
    step = st.radio("Jump to a step", STEPS, label_visibility="collapsed")

st.caption("Walk the whole workflow once — each step is one stage of the system.")


# ===========================================================================
# STEP 1 — frame the product question
# ===========================================================================
if step == STEPS[0]:
    st.header("1 · Frame the product question")
    st.markdown(
        "> **Which users retain, monetize, or churn — and what should the team do about it?**"
    )
    st.markdown(
        "A sharp question drives everything downstream. We will make it concrete with three "
        "decisions a product team actually faces:"
    )
    st.markdown(
        "- **Retention** — can we predict who will still be active on day 7 (`retained_d7`)?\n"
        "- **Monetization** — can we predict 30-day revenue per user (`total_revenue_30d`)?\n"
        "- **Segmentation** — what natural behavioral groups exist, and which ones to target?"
    )
    st.info(
        "Success criterion: a model good enough to *prioritize* interventions (who to nudge, "
        "who to upsell) — not perfect prediction. The decision is the product, not the AUC.",
        icon="🎯",
    )

# ===========================================================================
# STEP 2 — inspect the tables
# ===========================================================================
elif step == STEPS[1]:
    st.header("2 · Inspect the tables")
    st.markdown(
        "Before any analysis, know the **grain** of each table. Our synthetic product-analytics "
        "schema is relational: users, their sessions, fine-grained events, transactions, and a "
        "label table with the outcomes we want to predict."
    )
    st.subheader("Row counts")
    st.dataframe(table_overview(), use_container_width=True, hide_index=True)

    st.subheader("A peek at each table (`.head()`)")
    for t in TABLES:
        with st.expander(f"`{t}` — first rows"):
            st.dataframe(run_query(f"SELECT * FROM {t} LIMIT 5;"),
                         use_container_width=True, hide_index=True)
    st.caption(
        "Grain matters: `users` is one row per user, but `sessions`/`events`/`transactions` "
        "are many-rows-per-user. We must aggregate them to user level before modeling."
    )

# ===========================================================================
# STEP 3 — SQL-style joins
# ===========================================================================
elif step == STEPS[2]:
    st.header("3 · SQL-style joins")
    st.markdown(
        "Real product data lives across tables. A **join** brings them together. Here we join "
        "`users` to `labels` and to a per-user session count — exactly the kind of query that "
        "starts a feature-engineering pipeline."
    )
    sql = """
SELECT u.user_id,
       u.acquisition_channel,
       u.device,
       COUNT(s.session_id) AS n_sessions,
       l.retained_d7,
       l.total_revenue_30d
FROM users AS u
LEFT JOIN sessions AS s ON s.user_id = u.user_id
LEFT JOIN labels   AS l ON l.user_id = u.user_id
GROUP BY u.user_id, u.acquisition_channel, u.device, l.retained_d7, l.total_revenue_30d
ORDER BY n_sessions DESC
LIMIT 10;
""".strip()
    st.code(sql, language="sql")
    st.dataframe(run_query(sql), use_container_width=True, hide_index=True)
    st.info(
        "A **LEFT JOIN from users** keeps every user even if they have no sessions or no "
        "transactions (they get 0 / NULL) — an INNER JOIN would silently drop them and bias "
        "the analysis toward active users.",
        icon="🔗",
    )

# ===========================================================================
# STEP 4 — cleaning
# ===========================================================================
elif step == STEPS[3]:
    st.header("4 · Cleaning")
    st.markdown(
        "The data is synthetic and internally consistent, so it needs **less** cleaning than a "
        "real export — being honest about that matters. The realistic cleaning concerns here are:"
    )
    st.markdown(
        "- **Types** — timestamps arrive as text and must be parsed to datetimes before any "
        "time-window aggregation (e.g. 'sessions in the first 7 days').\n"
        "- **Join fan-out** — the one-to-many joins above duplicate user rows; we de-duplicate "
        "by aggregating back to one row per user.\n"
        "- **Missing-by-absence** — a user with no purchases has no transaction rows at all; "
        "after the LEFT JOIN those become NaN and must be filled with 0 (absence *is* the signal)."
    )
    st.subheader("Raw dtypes (note the text timestamps)")
    sess = load_table("sessions")
    dt = pd.DataFrame({"column": sess.columns, "dtype": [str(d) for d in sess.dtypes]})
    st.dataframe(dt, use_container_width=True, hide_index=True)
    st.caption(
        "`session_start` is an `object` (text). The feature builder parses it with "
        "`pd.to_datetime` before computing 'hours since signup'."
    )

# ===========================================================================
# STEP 5 — feature engineering
# ===========================================================================
elif step == STEPS[4]:
    st.header("5 · Feature engineering")
    st.markdown(
        "Models never see raw logs. We **aggregate** the many-rows-per-user event/session/"
        "transaction data into one row per user — counts, sums, averages, and binary flags over "
        "each user's first week. This split-apply-combine step is the single most important "
        "applied-DS skill."
    )
    feats = load_features()
    st.dataframe(feats.head(10), use_container_width=True, hide_index=True)
    st.markdown(f"**Feature matrix:** {feats.shape[0]:,} users × {len(FEATURE_COLUMNS)} features.")
    with st.expander("The engineered feature columns"):
        st.markdown("\n".join(f"- `{c}`" for c in FEATURE_COLUMNS))
    st.info(
        "Every feature is measured in the user's **first 7 days**, while the targets "
        "(`retained_d7`, `total_revenue_30d`) come later — that ordering avoids **leakage** "
        "(using the future to predict the future).",
        icon="🧱",
    )

# ===========================================================================
# STEP 6 — EDA
# ===========================================================================
elif step == STEPS[5]:
    st.header("6 · EDA")
    st.markdown(
        "Look before you model. A few quick charts on the enriched modeling frame surface the "
        "patterns a PM needs to know about."
    )
    eda = load_eda()
    c1, c2 = st.columns(2)
    with c1:
        st.pyplot(example_chart("bar", eda))
        st.caption("Retention is uneven across acquisition channels — a spend-allocation clue.")
    with c2:
        st.pyplot(example_chart("scatter", eda))
        st.caption("More early sessions loosely tracks higher revenue — engagement and money relate.")
    st.pyplot(example_chart("heatmap", eda))
    st.caption(
        "The correlation heatmap shows which early signals move together — and is a quick "
        "leakage check (a suspicious 0.99 would mean a feature secretly encodes the target)."
    )

# ===========================================================================
# STEP 7 — visualize a key relationship (with a takeaway)
# ===========================================================================
elif step == STEPS[6]:
    st.header("7 · Visualize key relationships")
    st.markdown(
        "One chart, one written takeaway — that is how an insight reaches a decision-maker. "
        "Revenue spread by player type shows the **whale problem** every product faces."
    )
    eda = load_eda()
    st.pyplot(example_chart("box", eda))
    st.success(
        "**Takeaway:** revenue is extremely right-skewed — most users spend near nothing while a "
        "few 'whales' dominate. That shape is why average revenue is misleading, why the revenue "
        "model is hard, and why a *segmentation* (step 10) is worth doing.",
        icon="📌",
    )

# ===========================================================================
# STEP 8 — D7 retention classifier
# ===========================================================================
elif step == STEPS[7]:
    st.header("8 · D7 retention classifier")
    st.markdown(
        "Predict the binary outcome `retained_d7` from first-week behavior with a **Random "
        "Forest**. We report metrics on a held-out test split — honest numbers only."
    )
    res, metrics, counts, imp = train_d7_rf()

    m1, m2, m3, m4, m5 = st.columns(5)
    m1.metric("Accuracy", f"{metrics['accuracy']:.3f}")
    m2.metric("Precision", f"{metrics['precision']:.3f}")
    m3.metric("Recall", f"{metrics['recall']:.3f}")
    m4.metric("F1", f"{metrics['f1']:.3f}")
    m5.metric("ROC-AUC", f"{metrics.get('roc_auc', float('nan')):.3f}")

    c1, c2 = st.columns(2)
    with c1:
        st.pyplot(confusion_matrix_fig(counts))
    with c2:
        st.pyplot(importance_fig(imp, title="What drives D7 retention?"))
    st.info(
        f"AUC ≈ {metrics.get('roc_auc', float('nan')):.3f} — clearly better than a coin flip, "
        f"good enough to *prioritize* who to nudge. Top drivers: "
        f"{', '.join('`' + f + '`' for f in imp.head(3)['feature'].tolist())}.",
        icon="🌲",
    )

# ===========================================================================
# STEP 9 — 30-day revenue regressor
# ===========================================================================
elif step == STEPS[8]:
    st.header("9 · 30-day revenue regressor")
    st.markdown(
        "Now a **numeric** target: each user's `total_revenue_30d`. Same Random Forest workflow, "
        "regression metrics (MAE / RMSE / R²) on held-out data."
    )
    res, metrics = train_revenue_rf()

    m1, m2, m3 = st.columns(3)
    m1.metric("MAE", f"${metrics['mae']:.2f}")
    m2.metric("RMSE", f"${metrics['rmse']:.2f}")
    m3.metric("R²", f"{metrics['r2']:.3f}")

    st.pyplot(actual_vs_predicted_fig(res.y_test, res.y_pred))
    st.info(
        f"**Honest result:** revenue is genuinely hard — R² ≈ {metrics['r2']:.2f}. The skew from "
        "step 7 means a few whales dominate and the model fans out at the top. A modest-but-real "
        "model still beats guessing the mean, and ranks users well enough to target upsells.",
        icon="💰",
    )

# ===========================================================================
# STEP 10 — user clustering
# ===========================================================================
elif step == STEPS[9]:
    st.header("10 · User clustering")
    st.markdown(
        "No target this time — **unsupervised** segmentation. K-means groups users by behavior; "
        "PCA projects the high-dimensional feature space to 2D so we can *see* the segments."
    )
    cl, profile = run_clustering(4)

    c1, c2 = st.columns([1, 1])
    with c1:
        st.pyplot(cluster_scatter_fig(cl.coords_2d, cl.labels, cl.centers_2d))
    with c2:
        st.metric("Silhouette", f"{cl.silhouette:.3f}",
                  help="-1 to 1; higher = tighter, better-separated clusters.")
        st.metric("PCA variance shown", f"{cl.explained_variance.sum():.0%}",
                  help="How much of the original spread the 2D map preserves.")
    st.subheader("Who are these segments? (mean feature value per cluster)")
    st.dataframe(profile, use_container_width=True)
    st.caption(
        "Read the profile across rows: the cluster with high `purchases_7d` / `revenue_7d` is "
        "your spender segment — the one worth a premium offer."
    )

# ===========================================================================
# STEP 11 — model evaluation (comparison table)
# ===========================================================================
elif step == STEPS[10]:
    st.header("11 · Model evaluation")
    st.markdown(
        "Don't trust one model on one metric. Here we train **three** classifiers for D7 "
        "retention on the same split and compare them across every metric."
    )
    comp = compare_classifiers()
    styled = comp.set_index("model")
    st.dataframe(
        styled.style.format("{:.3f}").highlight_max(axis=0, color="#1f4f2f"),
        use_container_width=True,
    )
    st.info(
        "The three models land close together — a sign the *signal*, not the algorithm, is the "
        "ceiling. Logistic Regression is the most interpretable and competitive on AUC, while "
        "the Random Forest is the strongest all-round tabular baseline. Pick the simplest model "
        "that clears the bar.",
        icon="⚖️",
    )

# ===========================================================================
# STEP 12 — PM recommendation memo (auto-populated with real numbers)
# ===========================================================================
elif step == STEPS[11]:
    st.header("12 · PM recommendation memo")
    st.markdown("The payoff: analysis → **decision**. Every number below is computed live above.")

    # pull the real, cached results
    _, c_metrics, _, imp = train_d7_rf()
    _, r_metrics = train_revenue_rf()
    cl, profile = run_clustering(4)
    comp = compare_classifiers()

    auc = c_metrics.get("roc_auc", float("nan"))
    top3 = imp.head(3)["feature"].tolist()
    best_row = comp.loc[comp["roc_auc"].idxmax()]
    # the spender cluster = highest mean 7-day revenue
    spender_cluster = int(profile["revenue_7d"].idxmax())
    spender_n = int(profile.loc[spender_cluster, "n_users"])

    memo = f"""
### 📝 Memo: retention & monetization, and what to do next

**To:** Product team  **From:** Data Science  **Re:** First-week levers for D7 retention and revenue

**1. We can predict D7 retention well enough to act.**
A Random Forest on first-week behavior reaches **ROC-AUC = {auc:.3f}** on held-out users — well
above a coin flip. Across a three-model bake-off, **{best_row['model']}** was the strongest on AUC
({best_row['roc_auc']:.3f}), and all models agreed, so we trust the ranking.

**2. The top drivers of retention are early engagement quality.**
The three biggest signals are **{top3[0]}**, **{top3[1]}**, and **{top3[2]}**. These are
behaviors we can *influence* in onboarding — not fixed user traits.

**3. Revenue is predictable but hard.**
The 30-day revenue model lands at **R² = {r_metrics['r2']:.2f}** (MAE ≈ ${r_metrics['mae']:.2f}).
Good enough to *rank* likely spenders for upsell, not to forecast exact dollars — revenue is
dominated by a few whales.

**4. There is a clear spender segment to target.**
K-means surfaced behavioral clusters (silhouette {cl.silhouette:.2f}). **Cluster {spender_cluster}**
({spender_n:,} users) has the highest early revenue — the segment to hit with premium offers.

**Recommendation**
- **Push tutorial completion and first-session quality** in onboarding — the model says early
  engagement, especially `{top3[0]}`, is what separates retained users.
- **Target Cluster {spender_cluster} (the spenders) with premium offers**; use the revenue model's
  ranking to prioritize within it.
- **Ship the retention classifier as a daily 'at-risk' list**, monitor for drift, and A/B test the
  onboarding nudge against this baseline.
"""
    st.markdown(memo)
    st.success(
        "That is the whole system: a product question became SQL, then features, then models, "
        "then an honest evaluation — and finally a decision a team can act on this sprint.",
        icon="🏁",
    )
