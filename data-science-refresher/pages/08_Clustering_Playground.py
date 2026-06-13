"""
08_Clustering_Playground.py — segment users with K-means + PCA.

Educational purpose: clustering is unsupervised — there's no label, just the
question "do natural groups exist in behavior?" This page runs K-means, projects
the high-dimensional users into an honest 2D PCA map you can look at, helps pick
k with the elbow + silhouette, and turns each cluster's profile into a plain-English
segment label so the math connects to a product action.
"""

import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from src.ui import bootstrap, page_header, data_status_sidebar

import streamlit as st

from src.feature_engineering import get_classification_xy
from src.modeling import run_kmeans_pca, elbow_curve, cluster_profile
from src.metrics import METRIC_EXPLANATIONS
from src.visualizations import cluster_scatter_fig, elbow_fig

# -- standard page setup -----------------------------------------------------
bootstrap("Clustering Playground", icon="🧩")
data_status_sidebar()
page_header(
    "🧩 Clustering Playground",
    "No labels here — just behavior. K-means finds **natural user segments**; PCA gives us a "
    "2D map to *see* them. Pick k, read the segments, and tie each to a product action.",
    stage="Model Selection / Interpretation",
)


# ---------------------------------------------------------------------------
# cached data + models
# ---------------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def load_X():
    """Use the classification feature matrix as the user feature space (ignore y)."""
    X, _, names = get_classification_xy("retained_d7")
    return X, names


@st.cache_data(show_spinner=False)
def run_cluster(k: int):
    X, _ = load_X()
    cl = run_kmeans_pca(X, k)
    return cl, cluster_profile(X, cl.labels)


@st.cache_data(show_spinner=False)
def run_elbow():
    X, _ = load_X()
    return elbow_curve(X)


X, feature_names = load_X()


def segment_label(row) -> str:
    """
    Heuristic, human-readable name for a cluster from its mean profile.

    Teaching aid only: real segment naming needs domain review. We compare each
    cluster's means to the population means and pick the dominant story.
    """
    pop = X.mean()
    high = lambda c: row[c] > pop[c] * 1.15
    low = lambda c: row[c] < pop[c] * 0.85

    if high("revenue_7d") or high("purchases_7d"):
        return "💸 Spenders — paying early"
    if high("total_sessions_7d") and not high("revenue_7d"):
        return "🔥 Engaged non-payers"
    if high("completed_tutorial") and not high("total_sessions_7d"):
        return "🌱 Onboarded, lightly active"
    if low("total_sessions_7d") and low("event_diversity"):
        return "💤 Dormant / one-and-done"
    return "🙂 Average / mixed"


# -- 1. pick k and cluster ---------------------------------------------------
k = st.slider("Number of clusters (k)", 2, 8, 4)
cl, profile = run_cluster(k)

left, right = st.columns([1.3, 1])
with left:
    st.pyplot(cluster_scatter_fig(cl.coords_2d, cl.labels, cl.centers_2d))
    pc1, pc2 = cl.explained_variance[0], cl.explained_variance[1]
    st.caption(
        f"PC1 + PC2 capture only **{(pc1 + pc2) * 100:.0f}%** of the variance "
        f"(PC1 {pc1 * 100:.0f}%, PC2 {pc2 * 100:.0f}%) — this 2D map is a useful but "
        "**lossy** view of high-dimensional clusters."
    )
with right:
    st.metric("Silhouette", f"{cl.silhouette:.3f}",
              help="Higher = tighter, better-separated clusters (range -1 to 1).")
    st.metric("Inertia", f"{cl.inertia:,.0f}",
              help="Within-cluster sum of squares — always falls as k rises.")
    st.caption(METRIC_EXPLANATIONS["silhouette"])

st.divider()

# -- 2. choosing k -----------------------------------------------------------
st.subheader("How many clusters? The elbow + silhouette")
ec1, ec2 = st.columns([1.3, 1])
with ec1:
    st.pyplot(elbow_fig(run_elbow()))
with ec2:
    st.markdown(
        "**Inertia always falls** as k grows (more clusters fit tighter), so it can't pick k "
        "alone — look for the *elbow* where the drop slows. **Silhouette** peaks at the k with "
        "the cleanest separation, so use it to break the tie."
    )

st.divider()

# -- 3. segment profiles -----------------------------------------------------
st.subheader("Who are these segments?")
labels = [segment_label(row) for _, row in profile.iterrows()]
display = profile.copy()
display.insert(0, "segment (heuristic)", labels)
st.dataframe(display, use_container_width=True)
st.caption(
    "Mean feature value per cluster (plus n_users). The **segment** column is a simple "
    "rule-of-thumb label — a teaching aid, not a substitute for domain review."
)

# -- 4. product framing ------------------------------------------------------
st.info(
    "**Segments → actions:** target **spenders** with premium offers and loyalty perks; "
    "convert **engaged non-payers** with a well-timed first-purchase nudge; deepen the habit "
    "for the **lightly active**; and re-engage the **dormant** with a comeback campaign (or "
    "accept they're lost and stop spending on them). Segmentation turns one average user into "
    "a handful of distinct strategies.",
    icon="🧭",
)
