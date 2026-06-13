"""
03_Pandas_Lab.py — five hands-on pandas transformations on the real tables.

Educational purpose: the daily grammar of applied data science is filter →
groupby → merge → pivot → engineer-a-feature. Each mini-lab shows the exact code
the learner would write, lets them tweak one parameter, and renders the
before/after DataFrames so the transformation is visible, not abstract. The fifth
lab deliberately ends at a model-ready feature — the bridge into the modeling
pages.
"""

import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from src.ui import bootstrap, page_header, data_status_sidebar
from src.db import load_table
from src.feature_engineering import build_modeling_frame

import pandas as pd
import streamlit as st

# --- standard page setup ----------------------------------------------------
bootstrap("Pandas Lab", icon="🐼")
data_status_sidebar()
page_header(
    "🐼 Pandas Lab",
    "Five mini-labs covering the everyday pandas moves: **filter, groupby, merge, "
    "pivot, and engineer a feature.** Each one shows the code you'd write, lets you "
    "tweak a knob, and renders the before/after so the transformation is visible.",
    stage="Data Wrangling",
)

# load the base tables once (cached implicitly by SQLite speed; tables are small)
users = load_table("users")
labels = load_table("labels")

tab1, tab2, tab3, tab4, tab5 = st.tabs(
    ["1 · Filter", "2 · GroupBy", "3 · Merge", "4 · Pivot", "5 · Feature"]
)

# ---------------------------------------------------------------------------
# LAB 1 — Filter rows (boolean masking)
# Teaching purpose: a boolean mask is the most basic slice; row count is the
# feedback that tells you the filter did what you meant.
# ---------------------------------------------------------------------------
with tab1:
    st.subheader("Filter rows with a boolean mask")
    col = st.selectbox("Column to filter on", ["country", "device", "acquisition_channel", "age_band"])
    val = st.selectbox("Keep rows where it equals", sorted(users[col].unique()))

    st.code(
        f"users = load_table('users')\n"
        f"filtered = users[users['{col}'] == '{val}']\n"
        f"len(filtered)",
        language="python",
    )

    filtered = users[users[col] == val]
    a, b = st.columns(2)
    a.metric("Rows before", f"{len(users):,}")
    b.metric("Rows after", f"{len(filtered):,}")
    st.dataframe(filtered.head(10), use_container_width=True, hide_index=True)
    st.caption("A filter is just a boolean Series indexing the DataFrame. Always sanity-check the new row count.")

# ---------------------------------------------------------------------------
# LAB 2 — GroupBy aggregation (split-apply-combine)
# Teaching purpose: groupby is THE muscle for analytics — collapse many rows
# into one number per group. We average a retention label per segment.
# ---------------------------------------------------------------------------
with tab2:
    st.subheader("GroupBy + aggregate (split-apply-combine)")
    gcol = st.selectbox("Group by", ["acquisition_channel", "player_type_seed", "device", "country"])

    st.code(
        f"m = users.merge(labels, on='user_id')\n"
        f"result = m.groupby('{gcol}')['retained_d7'].mean().sort_values(ascending=False)\n"
        f"result",
        language="python",
    )

    merged = users.merge(labels, on="user_id")
    result = merged.groupby(gcol)["retained_d7"].mean().sort_values(ascending=False)
    g1, g2 = st.columns([1, 1])
    with g1:
        st.dataframe(
            result.round(3).rename("mean_retained_d7").reset_index(),
            use_container_width=True,
            hide_index=True,
        )
    with g2:
        # a quick bar chart makes the segment ranking obvious
        st.bar_chart(result)
    st.caption("Split the rows by group, apply mean() to each, combine back into one row per group. "
               "This is how you turn 5,000 users into a segment-level story.")

# ---------------------------------------------------------------------------
# LAB 3 — Merge tables (the pandas equivalent of a SQL join)
# Teaching purpose: how= controls which rows survive, exactly like join type.
# Watch the shape change.
# ---------------------------------------------------------------------------
with tab3:
    st.subheader("Merge two tables on a key")
    how = st.radio("how =", ["inner", "left", "right", "outer"], horizontal=True)

    st.code(
        f"merged = users.merge(labels, on='user_id', how='{how}')\n"
        f"print('users:', users.shape)\n"
        f"print('labels:', labels.shape)\n"
        f"print('merged:', merged.shape)",
        language="python",
    )

    merged3 = users.merge(labels, on="user_id", how=how)
    s1, s2, s3 = st.columns(3)
    s1.metric("users shape", f"{users.shape[0]}×{users.shape[1]}")
    s2.metric("labels shape", f"{labels.shape[0]}×{labels.shape[1]}")
    s3.metric("merged shape", f"{merged3.shape[0]}×{merged3.shape[1]}")
    st.dataframe(merged3.head(8), use_container_width=True, hide_index=True)
    st.caption("Here every user has exactly one label, so all four `how=` values give 5,000 rows — "
               "but the column count grows. With missing keys, `how=` would change the row count, just like a SQL join.")

# ---------------------------------------------------------------------------
# LAB 4 — Pivot table (two-dimensional aggregation)
# Teaching purpose: a pivot is a groupby on TWO keys laid out as a grid — perfect
# for spotting interaction effects (does channel quality depend on device?).
# ---------------------------------------------------------------------------
with tab4:
    st.subheader("Pivot table — aggregate across two dimensions")
    idx_col = st.selectbox("Rows (index)", ["acquisition_channel", "player_type_seed", "country"])
    col_col = st.selectbox("Columns", ["device", "age_band", "churn_risk"])

    st.code(
        f"m = users.merge(labels, on='user_id')\n"
        f"pivot = pd.pivot_table(m, values='retained_d7',\n"
        f"                       index='{idx_col}', columns='{col_col}', aggfunc='mean')\n"
        f"pivot.round(3)",
        language="python",
    )

    m4 = users.merge(labels, on="user_id")
    pivot = pd.pivot_table(m4, values="retained_d7", index=idx_col, columns=col_col, aggfunc="mean")
    # style with a gradient so high/low cells pop -- the interaction reads instantly
    st.dataframe(pivot.round(3).style.background_gradient(cmap="Greens", axis=None), use_container_width=True)
    st.caption("Each cell is mean D7 retention for that (row, column) combination. "
               "Scan for cells that break the row/column pattern — that's an interaction effect worth a PM's attention.")

# ---------------------------------------------------------------------------
# LAB 5 — Engineer a feature (the bridge to modeling)
# Teaching purpose: models consume engineered signals, not raw rows. We build a
# revenue-per-session ratio and a binary high-value flag from the modeling frame
# and show they're the columns a model would actually train on.
# ---------------------------------------------------------------------------
with tab5:
    st.subheader("Engineer a feature — the bridge to modeling")
    st.caption("Raw columns rarely model well as-is. Engineering combines them into a signal aligned to the outcome.")

    pct = st.slider("High-value cutoff (top X% of 7-day revenue)", 5, 30, 10, step=5)

    st.code(
        f"mf = build_modeling_frame()  # one row per user: features + targets\n"
        f"# ratio feature: revenue intensity per session\n"
        f"mf['revenue_per_session'] = mf['revenue_7d'] / mf['total_sessions_7d'].replace(0, 1)\n"
        f"# binary flag: is this user in the top {pct}% by early revenue?\n"
        f"cutoff = mf['revenue_7d'].quantile({1 - pct/100:.2f})\n"
        f"mf['high_value'] = (mf['revenue_7d'] > cutoff).astype(int)",
        language="python",
    )

    mf = build_modeling_frame()
    mf["revenue_per_session"] = mf["revenue_7d"] / mf["total_sessions_7d"].replace(0, 1)
    cutoff = mf["revenue_7d"].quantile(1 - pct / 100)
    mf["high_value"] = (mf["revenue_7d"] > cutoff).astype(int)

    f1, f2 = st.columns(2)
    f1.metric("High-value users flagged", f"{int(mf['high_value'].sum()):,}")
    f2.metric("Their D7 retention", f"{mf.loc[mf['high_value'] == 1, 'retained_d7'].mean():.1%}")

    st.markdown("**New columns next to the target the model will predict:**")
    st.dataframe(
        mf[["user_id", "revenue_7d", "total_sessions_7d", "revenue_per_session", "high_value", "retained_d7"]].head(10),
        use_container_width=True,
        hide_index=True,
    )
    st.success(
        "These engineered columns — not the raw event logs — are what the classification and regression "
        "pages feed to a model. Good features are where domain knowledge beats algorithm choice."
    )
