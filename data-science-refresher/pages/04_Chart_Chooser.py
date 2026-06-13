"""
04_Chart_Chooser.py — pick the right chart for the question you're asking.

Educational purpose: the most common visualization mistake isn't a bad-looking
chart, it's the *wrong* chart for the question. This page turns the question →
chart decision into a lookup the learner can feel: choose a question type, see
the recommended chart rendered on real product-analytics data, and read the
anti-pattern that quietly misleads stakeholders.
"""

import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from src.ui import bootstrap, page_header, data_status_sidebar

import pandas as pd
import streamlit as st

from src.content import CHART_RECOMMENDATIONS
from src.feature_engineering import build_eda_frame
from src.visualizations import example_chart

# -- standard page setup -----------------------------------------------------
bootstrap("Chart Chooser", icon="📊")
data_status_sidebar()
page_header(
    "📊 Chart Chooser",
    "Start from the **question**, not the chart. Pick what you're trying to show and "
    "get the chart that makes that pattern obvious — plus the anti-pattern that hides it.",
    stage="Visualization",
)

# what to look for in each rendered example (the "read this chart" caption)
WHAT_TO_LOOK_FOR = {
    "Comparison": "Read the bar lengths: which acquisition channel retains best, and how big is the gap?",
    "Trend": "Follow the line over time: is signup volume rising, flat, or seasonal?",
    "Distribution": "Look at the shape: where's the bulk, is it skewed, are there long-tail outliers?",
    "Relationship": "Look for an upward/downward cloud: do more sessions come with more revenue?",
    "Correlation": "Scan for hot/cold cells: which features move together (and watch for suspicious ~1.0s)?",
    "Geography": "Compare regions — but remember raw counts need normalizing by user base.",
    "Composition": "Read each stacked bar as 100%: how does the churn-risk mix shift across channels?",
}

# -- 1. choose the question type --------------------------------------------
question = st.radio(
    "What kind of question are you answering?",
    options=list(CHART_RECOMMENDATIONS.keys()),
    horizontal=True,
)
rec = CHART_RECOMMENDATIONS[question]

# -- 2. show the recommendation + live example side by side ------------------
left, right = st.columns([1, 1.3])

with left:
    st.subheader(f"→ {rec['chart']}")
    st.markdown(f"**Why:** {rec['why']}")
    st.warning(f"**Anti-pattern:** {rec['antipattern']}", icon="⚠️")
    if question == "Geography":
        st.info(
            "A real geography question wants a **choropleth map**. We don't ship a map "
            "renderer here, so we approximate with a **bar by region (country)** as a "
            "stand-in — the decision logic is identical, only the spatial encoding differs.",
            icon="🗺️",
        )

with right:
    df = build_eda_frame()
    fig = example_chart(rec["kind"], df)
    st.pyplot(fig)
    st.caption(WHAT_TO_LOOK_FOR[question])

st.divider()

# -- 3. the whole decision map at a glance -----------------------------------
st.subheader("The whole decision map")
st.caption("Every question type → its chart and the trap to avoid. Memorize the column on the left.")

table = pd.DataFrame(
    [
        {
            "Question type": q,
            "Chart": r["chart"],
            "Why": r["why"],
            "Anti-pattern": r["antipattern"],
        }
        for q, r in CHART_RECOMMENDATIONS.items()
    ]
)
st.dataframe(table, use_container_width=True, hide_index=True)

st.info(
    "**Product framing:** the chart is how the insight reaches a decision-maker. The right "
    "chart makes the pattern self-evident in two seconds; the wrong one forces the PM to "
    "re-derive it (or, worse, misread it).",
    icon="💡",
)
