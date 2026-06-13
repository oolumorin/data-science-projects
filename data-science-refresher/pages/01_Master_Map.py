"""
01_Master_Map.py — an interactive map of the whole data-science workflow.

Educational purpose: data science is a *system*, not a bag of tricks. Before
learning any single technique, a learner should be able to point to where it
lives in the pipeline (Business question → … → Decision) and say what that stage
produces and how it pays off for the product. This page turns the static
WORKFLOW_STAGES list into something you click through, plus the
descriptive → diagnostic → predictive → prescriptive ladder of question types.
"""

import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from src.ui import bootstrap, page_header, data_status_sidebar
from src.content import WORKFLOW_STAGES, QUESTION_TYPES

import streamlit as st

# --- standard page setup (config + DB + sidebar status) --------------------
bootstrap("Master Map", icon="🗺️")
data_status_sidebar()
page_header(
    "🗺️ Master Map",
    "Every other page in this app is **one stage** of the pipeline below. "
    "Click a stage to see what happens there, the tools, the classic mistakes, "
    "what it outputs, and why a product team should care.",
    stage="all / orientation",
)

# one emoji per stage so the flow reads as a picture, not a list
STAGE_ICONS = ["🎯", "🗂️", "🧲", "🧹", "🔧", "🔍", "📊", "🧬", "🧭", "🏋️", "📐", "🧠", "📣"]

# ---------------------------------------------------------------------------
# SECTION 1 — the pipeline as a numbered, clickable flow
# Teaching purpose: make the *order* and *direction* of the workflow concrete.
# ---------------------------------------------------------------------------
st.subheader("1 · The pipeline")
st.caption("Pick a stage to open its detail card. The whole point is that data flows left-to-right, top-to-bottom.")

# render the flow as a single breadcrumb so the sequence is visible at a glance
flow = " &nbsp;→&nbsp; ".join(
    f"{STAGE_ICONS[i % len(STAGE_ICONS)]} **{s.name.split(' / ')[0]}**"
    for i, s in enumerate(WORKFLOW_STAGES)
)
st.markdown(
    f"<div style='line-height:2.4; font-size:0.9rem; color:#b9c0cc'>{flow}</div>",
    unsafe_allow_html=True,
)

# a selectbox acts as the "jump to a stage" control of the map
labels = [
    f"{i+1}. {STAGE_ICONS[i % len(STAGE_ICONS)]} {s.name}"
    for i, s in enumerate(WORKFLOW_STAGES)
]
choice = st.selectbox("Jump to a stage", labels, index=0)
idx = labels.index(choice)
stage = WORKFLOW_STAGES[idx]

# a progress bar shows how far through the pipeline this stage sits
st.progress((idx + 1) / len(WORKFLOW_STAGES))
st.caption(f"Stage **{idx + 1} of {len(WORKFLOW_STAGES)}** in the workflow.")

# ---------------------------------------------------------------------------
# SECTION 2 — the detail card for the selected stage
# Teaching purpose: every stage answers the same five questions, so the learner
# builds a repeatable mental checklist.
# ---------------------------------------------------------------------------
st.markdown(f"### {STAGE_ICONS[idx % len(STAGE_ICONS)]} {stage.name}")

col_a, col_b = st.columns(2)
with col_a:
    st.markdown("**🔧 What happens**")
    st.info(stage.what)
    st.markdown("**🧰 Tools**")
    st.markdown(stage.tools)
    st.markdown("**📤 Output**")
    st.success(stage.output)
with col_b:
    st.markdown("**⚠️ Common mistakes**")
    st.warning(stage.mistakes)
    st.markdown("**💡 Product payoff**")
    st.markdown(stage.product)

# small prev/next orientation aids so the learner feels the chain
nav_l, nav_r = st.columns(2)
with nav_l:
    if idx > 0:
        st.caption(f"⬅️ Previous: **{WORKFLOW_STAGES[idx - 1].name}**")
with nav_r:
    if idx < len(WORKFLOW_STAGES) - 1:
        st.caption(f"Next: **{WORKFLOW_STAGES[idx + 1].name}** ➡️")

st.divider()

# ---------------------------------------------------------------------------
# SECTION 3 — the question-type ladder (descriptive → prescriptive)
# Teaching purpose: the kind of *question* you're asked dictates the analytics
# type, the methods, the charts, and whether you even need a model. This is the
# single most useful framing for choosing an approach.
# ---------------------------------------------------------------------------
st.subheader("2 · What kind of question is it?")
st.caption(
    "The four analytics types form a ladder of increasing ambition. "
    "Most product asks are *descriptive* or *diagnostic* — you don't always need a model."
)

q = st.radio(
    "Pick the question you're being asked",
    list(QUESTION_TYPES.keys()),
    horizontal=True,
)
info = QUESTION_TYPES[q]

# show where this question sits on the descriptive→prescriptive ladder
ladder = list(QUESTION_TYPES.keys())
rung = ladder.index(q)
st.progress((rung + 1) / len(ladder))

c1, c2, c3, c4 = st.columns(4)
c1.metric("Analytics type", info["analytics"])
c2.metric("Typical chart", info["charts"].split(",")[0].strip())
c3.metric("Needs a model?", "No" if "None" in info["models"] else "Yes")
c4.metric("Rung", f"{rung + 1} / {len(ladder)}")

st.markdown(f"**Methods** — {info['methods']}")
st.markdown(f"**Charts** — {info['charts']}")
st.markdown(f"**Models** — {info['models']}")

if "None" in info["models"]:
    st.success("Descriptive work: summarize what already happened. Don't reach for ML — a clear chart wins.")
elif info["analytics"] == "Predictive":
    st.info("Now you need supervised learning and an honest train/test split — that's the Playground pages.")
elif info["analytics"] == "Prescriptive":
    st.info("The hardest rung: recommending an action means optimization or uplift, not just a prediction.")
else:
    st.info("Diagnostic work: slice and compare segments to explain *why* the number moved.")

st.divider()
st.caption(
    "Mental model: a product question selects a *rung* (descriptive→prescriptive), and the "
    "pipeline above is *how* you climb it. Every later page is one stage of that climb."
)
