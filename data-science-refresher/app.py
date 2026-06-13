"""
app.py — Data Science Refresher (Streamlit entry point / home page).

A visual-first, product-analytics-oriented refresher for the IBM Applied Data
Science / Data Science Professional Certificate material. The app teaches data
science as a *system* — every page attaches to one stage of the workflow below.

Run with:  streamlit run app.py
"""

from __future__ import annotations

import sys
from pathlib import Path

# allow `import src.*` when Streamlit runs this file directly
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import streamlit as st  # noqa: E402

from src.ui import bootstrap, data_status_sidebar  # noqa: E402
from src.content import WORKFLOW_STAGES  # noqa: E402

bootstrap("Home", icon="🧭")
data_status_sidebar()

st.title("🧭 Data Science Refresher")
st.markdown(
    "A **visual-first** refresher for the IBM Applied Data Science material, rebuilt around "
    "one idea: *data science is a system that turns a product question into a decision.* "
    "Every page below is one stage of that system, taught with an interactive — not a lecture."
)

st.info(
    "**Learn by doing.** Use the sidebar (or the pages list) to jump in. New here? Start with "
    "**Master Map**, then try the **SQL Join Visualizer** and the **Classification Playground**.",
    icon="👋",
)

# -- the master workflow map, rendered as a vertical flow --------------------
st.subheader("The workflow this app is built around")
st.caption("Business question → data → cleaning → EDA → features → model → evaluation → decision")

flow = " &nbsp;→&nbsp; ".join(f"**{s.name.split(' / ')[0]}**" for s in WORKFLOW_STAGES)
st.markdown(
    f"<div style='line-height:2.2; font-size:0.95rem; color:#b9c0cc'>{flow}</div>",
    unsafe_allow_html=True,
)

st.divider()

# -- page directory ----------------------------------------------------------
PAGES = [
    ("01 · Master Map", "Orient yourself: click any workflow stage to see what it does, its tools, common mistakes, and product payoff."),
    ("02 · SQL Join Visualizer", "Make joins spatial — run real SQL against SQLite and see INNER/LEFT/RIGHT/FULL side by side."),
    ("03 · Pandas Lab", "Practice the transformations: filter, groupby, merge, pivot, and engineer a feature."),
    ("04 · Chart Chooser", "Map a question type to the right chart, rendered on real product data."),
    ("05 · Algorithm Selector", "A decision tree from 'do you have a target?' to a shortlist of models, with algorithm cards."),
    ("06 · Regression Playground", "Compare linear / polynomial / tree regressors and watch MAE, RMSE, R² move."),
    ("07 · Classification Playground", "Predict D7 retention; tune the threshold and read the confusion matrix."),
    ("08 · Clustering Playground", "Segment users with K-means + PCA; pick k with the elbow and silhouette."),
    ("09 · Metrics Simulator", "Build intuition for every metric with interactive visual examples."),
    ("10 · Mini-Capstone", "The full applied project: question → SQL → features → models → PM memo."),
    ("11 · Quiz Mode", "Retrieval practice across the whole workflow."),
]

st.subheader("Pages")
cols = st.columns(2)
for i, (name, desc) in enumerate(PAGES):
    with cols[i % 2]:
        st.markdown(f"**{name}**")
        st.caption(desc)

st.divider()
st.caption(
    "Synthetic game/product-analytics dataset · 5,000 users · generated locally into SQLite. "
    "No external APIs. Use the sidebar to regenerate the data anytime."
)
