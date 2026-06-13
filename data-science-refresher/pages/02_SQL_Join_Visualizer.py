"""
02_SQL_Join_Visualizer.py — learn SQL joins by running REAL SQL against SQLite.

Educational purpose: joins are the #1 place a beginner silently corrupts their
data — either dropping rows they meant to keep (wrong join type) or fanning a
one-row-per-user table into many (one-to-many granularity). The cure is to *see*
it. This page builds two tiny human-readable toy tables (6 users, a couple of
purchases each, some users with none) and runs each join type live so the
learner watches rows appear, disappear, and turn into NULLs.
"""

import sys
import pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from src.ui import bootstrap, page_header, data_status_sidebar
from src.db import run_query

import streamlit as st

# --- standard page setup ----------------------------------------------------
bootstrap("SQL Join Visualizer", icon="🔗")
data_status_sidebar()
page_header(
    "🔗 SQL Join Visualizer",
    "Joins decide which rows survive. We build two **tiny** toy tables from the "
    "real data and run each join type live — so you can *see* NULLs appear and "
    "rows drop instead of memorizing a Venn diagram.",
    stage="SQL / APIs / CSVs / Scraping",
)

# ---------------------------------------------------------------------------
# The toy tables.
# Teaching purpose: kept deliberately tiny and hand-picked so the difference
# between join types is a handful of rows you can eye-ball.
#   toy_users:     6 users (mix of US/Brazil/India/Japan)
#   toy_purchases: <=2 purchases per user, only for SOME users + one ORPHAN
#                  purchase (a buyer not in the user set) to make FULL OUTER /
#                  RIGHT show their right-only rows.
# ---------------------------------------------------------------------------
USER_IDS = "('U00001','U00002','U00003','U00004','U00008','U00014')"
# purchasers include U00005, who is NOT in the user set -> the "orphan" row
PURCHASER_IDS = "('U00002','U00003','U00004','U00005')"

TOY_CTE = f"""WITH toy_users AS (
    -- LEFT table: one row per user (the grain we usually want to preserve)
    SELECT user_id, country FROM users
    WHERE user_id IN {USER_IDS}
),
toy_purchases AS (
    -- RIGHT table: at most 2 purchases per user; note U00005 buys but is
    -- NOT in toy_users (an orphan), and several users never buy at all
    SELECT user_id, item_category, amount_usd FROM (
        SELECT user_id, item_category, amount_usd,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY timestamp) AS rn
        FROM transactions
        WHERE user_id IN {PURCHASER_IDS}
    ) WHERE rn <= 2
)"""

st.subheader("The two toy tables")
st.caption("Look at these first — every join below combines exactly these rows.")
tcol1, tcol2 = st.columns(2)
with tcol1:
    st.markdown("**`toy_users`** — left table (one row per user)")
    users_df = run_query(TOY_CTE + "\nSELECT * FROM toy_users ORDER BY user_id;")
    st.dataframe(users_df, use_container_width=True, hide_index=True)
    st.caption(f"{len(users_df)} users. Some of them never made a purchase.")
with tcol2:
    st.markdown("**`toy_purchases`** — right table (one row per purchase)")
    purch_df = run_query(TOY_CTE + "\nSELECT * FROM toy_purchases ORDER BY user_id;")
    st.dataframe(purch_df, use_container_width=True, hide_index=True)
    st.caption(f"{len(purch_df)} purchases. Note **U00005** buys but is *not* in toy_users (an orphan).")

st.divider()

# ---------------------------------------------------------------------------
# SECTION 1 — pick a join type and run it for real.
# Teaching purpose: each join type is one SELECT we actually execute, with a
# plain-English readout of which side's unmatched rows it keeps.
# ---------------------------------------------------------------------------
st.subheader("1 · Pick a join and run it")

join_type = st.radio(
    "Join type",
    ["INNER", "LEFT", "RIGHT", "FULL OUTER"],
    horizontal=True,
    help="SQLite does INNER, LEFT and FULL OUTER natively. RIGHT is emulated by swapping table order in a LEFT JOIN.",
)

# Build the SELECT for the chosen join. SQLite has no RIGHT JOIN, so we emulate
# it by swapping the table order in a LEFT JOIN -- and we SAY SO, because that
# substitution is itself a useful lesson.
if join_type == "RIGHT":
    st.info(
        "⚠️ **SQLite has no `RIGHT JOIN`.** We emulate it by swapping the table order in a "
        "`LEFT JOIN` (`toy_purchases LEFT JOIN toy_users`). A right join just means 'keep every row "
        "of the right table' — which is identical to a left join with the tables flipped.",
        icon="🔁",
    )
    sql = TOY_CTE + """
SELECT u.user_id  AS user_side,
       u.country,
       p.user_id  AS purchase_side,
       p.item_category,
       p.amount_usd
FROM toy_purchases p
LEFT JOIN toy_users u ON u.user_id = p.user_id
ORDER BY p.user_id;"""
else:
    clause = {"INNER": "INNER JOIN", "LEFT": "LEFT JOIN", "FULL OUTER": "FULL OUTER JOIN"}[join_type]
    sql = TOY_CTE + f"""
SELECT u.user_id  AS user_side,
       u.country,
       p.user_id  AS purchase_side,
       p.item_category,
       p.amount_usd
FROM toy_users u
{clause} toy_purchases p ON u.user_id = p.user_id
ORDER BY COALESCE(u.user_id, p.user_id);"""

# (a) show the generated SQL
st.markdown("**Generated SQL**")
st.code(sql, language="sql")

# (b) show the result table
result = run_query(sql)
st.markdown("**Result**")
st.dataframe(result, use_container_width=True, hide_index=True)

# row-count readouts for context
inner_n = len(run_query(TOY_CTE + """
SELECT u.user_id FROM toy_users u
INNER JOIN toy_purchases p ON u.user_id = p.user_id;"""))
left_n = len(run_query(TOY_CTE + """
SELECT u.user_id FROM toy_users u
LEFT JOIN toy_purchases p ON u.user_id = p.user_id;"""))
full_n = len(run_query(TOY_CTE + """
SELECT u.user_id FROM toy_users u
FULL OUTER JOIN toy_purchases p ON u.user_id = p.user_id;"""))

m1, m2, m3 = st.columns(3)
m1.metric("This join returned", f"{len(result)} rows")
m2.metric("INNER would return", f"{inner_n} rows")
m3.metric("FULL OUTER returns", f"{full_n} rows")

# (c) plain-English explanation of which rows appeared / disappeared and why
n_user_only = result["purchase_side"].isna().sum() if "purchase_side" in result else 0
n_purch_only = result["user_side"].isna().sum() if "user_side" in result else 0

if join_type == "INNER":
    st.success(
        f"**INNER JOIN keeps only matched rows** — {inner_n} rows, every one with a user *and* a purchase. "
        f"Users with no purchase ({left_n - inner_n} of them) **vanish**, and the orphan buyer U00005 vanishes too. "
        "Risk: you can silently drop real users and not notice."
    )
elif join_type == "LEFT":
    st.success(
        f"**LEFT JOIN keeps every left (user) row** — {left_n} rows. The {n_user_only} users with no purchase "
        f"still appear, with **NULL** in the purchase columns. The orphan buyer U00005 is excluded (it's a right-only row). "
        "This is the safe default when 'one row per user' must be preserved."
    )
elif join_type == "RIGHT":
    st.success(
        f"**RIGHT JOIN (emulated) keeps every right (purchase) row** — {len(result)} rows including the orphan "
        f"**U00005**, whose `user_side`/`country` are **NULL** because no matching user exists. "
        "Same idea as LEFT, just from the other table's point of view."
    )
else:  # FULL OUTER
    st.success(
        f"**FULL OUTER JOIN keeps everything** — {full_n} rows. Unmatched users get NULL purchases "
        f"({n_user_only} of them), and the unmatched buyer U00005 gets NULL user fields ({n_purch_only} of them). "
        "Nothing is dropped; NULLs flag where the two sides disagree."
    )

st.divider()

# ---------------------------------------------------------------------------
# SECTION 2 — the one-to-many fan-out lesson.
# Teaching purpose: joining a one-row-per-user table to a many-rows-per-user
# table multiplies rows. If you then SUM/AVG without thinking, your numbers are
# wrong. Seeing one user explode into many rows makes this unforgettable.
# ---------------------------------------------------------------------------
st.subheader("2 · The one-to-many fan-out trap")
st.caption("Join a single user to their events and watch one row become many — the granularity lesson.")

fan_sql = """SELECT u.user_id, u.country, e.event_name, e.timestamp
FROM (SELECT user_id, country FROM users WHERE user_id = 'U00003') u
JOIN events e ON u.user_id = e.user_id
ORDER BY e.timestamp;"""
st.code(fan_sql, language="sql")

fan = run_query(fan_sql)
st.dataframe(fan.head(12), use_container_width=True, hide_index=True)

st.warning(
    f"**One user, {len(fan)} rows.** The user table has *one* row for U00003, but joining to `events` "
    f"fans it out to {len(fan)} — one per event. If you now `COUNT(*)` thinking you're counting users, "
    "you'll get events instead. Fix: aggregate the many-side first (GROUP BY user_id), *then* join.",
    icon="💥",
)
st.caption(
    "Rule of thumb: before any join, ask 'what is the grain of each table?' "
    "Joining two different grains is where most analytics bugs are born."
)
