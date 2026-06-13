"""
11_Quiz_Mode.py — retrieval practice across the whole workflow.

Educational purpose: a refresher only sticks if you *retrieve* it, not just
re-read it. This page turns the quiz bank into an active-recall quiz: one
question at a time, immediate feedback, and — most importantly — the explanation
every time (getting it wrong with a good explanation teaches more than guessing
right). Questions are reshuffled each attempt, score is tracked, and a final
review shows exactly what you missed and why.
"""

import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from src.ui import bootstrap, page_header, data_status_sidebar

import random

import streamlit as st

from src.quiz_bank import QUIZ_BANK, categories

# -- standard page setup -----------------------------------------------------
bootstrap("Quiz Mode", icon="🧠")
data_status_sidebar()
page_header(
    "🧠 Quiz Mode — retrieval practice",
    "Active recall across the whole workflow: SQL, charts, algorithms, metrics, and failure "
    "modes. Answer one question at a time and **read the explanation every time** — that is "
    "where the learning happens. Reshuffle for a fresh attempt whenever you like.",
    stage="Retrieval practice",
)

# page-specific session_state keys (avoid collisions with other pages)
PREFIX = "quiz11_"
K_ORDER = PREFIX + "order"          # list of QUIZ_BANK indices, shuffled
K_POS = PREFIX + "pos"              # current question position
K_ANSWERS = PREFIX + "answers"      # {bank_index: chosen_option_index}
K_SUBMITTED = PREFIX + "submitted"  # current question answered?
K_CATS = PREFIX + "cats"            # the category filter this attempt was built with


def _filtered_indices(selected_cats: list[str]) -> list[int]:
    """Indices into QUIZ_BANK whose category is in the selection."""
    return [i for i, q in enumerate(QUIZ_BANK) if q.category in selected_cats]


def start_attempt(selected_cats: list[str]) -> None:
    """(Re)build a shuffled attempt for the chosen categories and reset score."""
    order = _filtered_indices(selected_cats)
    random.shuffle(order)  # shuffle the QUESTIONS, not the options (correct_index stays valid)
    st.session_state[K_ORDER] = order
    st.session_state[K_POS] = 0
    st.session_state[K_ANSWERS] = {}
    st.session_state[K_SUBMITTED] = False
    st.session_state[K_CATS] = list(selected_cats)


# ---------------------------------------------------------------------------
# category filter
# ---------------------------------------------------------------------------
all_cats = categories()
selected = st.multiselect(
    "Filter by category (leave all selected for the full quiz)",
    options=all_cats,
    default=all_cats,
)

# graceful empty-filter handling
if not selected:
    st.warning("Select at least one category to start a quiz.", icon="⚠️")
    st.stop()

# (re)initialize the attempt if there isn't one yet, or the filter changed
if K_ORDER not in st.session_state or st.session_state.get(K_CATS) != selected:
    start_attempt(selected)

order = st.session_state[K_ORDER]
total = len(order)

# defensive: filter could (in theory) yield nothing
if total == 0:
    st.warning("No questions match that filter.", icon="⚠️")
    st.stop()

# sidebar controls + live score
with st.sidebar:
    st.markdown("### 🧠 Quiz")
    answered = len(st.session_state[K_ANSWERS])
    correct = sum(
        1 for bi, choice in st.session_state[K_ANSWERS].items()
        if choice == QUIZ_BANK[bi].correct_index
    )
    st.caption(f"Answered: {answered} / {total}")
    st.caption(f"Score so far: {correct} / {answered if answered else 0}")
    if st.button("🔄 Restart / new attempt", use_container_width=True):
        start_attempt(selected)
        st.rerun()

pos = st.session_state[K_POS]

# ---------------------------------------------------------------------------
# FINAL REVIEW (after the last question)
# ---------------------------------------------------------------------------
if pos >= total:
    answers = st.session_state[K_ANSWERS]
    correct = sum(1 for bi, c in answers.items() if c == QUIZ_BANK[bi].correct_index)
    pct = correct / total if total else 0.0

    st.header("🏁 Quiz complete")
    st.metric("Final score", f"{correct} / {total}", f"{pct:.0%}")
    st.progress(pct)
    if pct == 1.0:
        st.success("Perfect score — the fundamentals are solid.", icon="🎉")
    elif pct >= 0.7:
        st.info("Strong — review the misses below to close the gaps.", icon="👍")
    else:
        st.warning("Worth another pass — read each explanation, then reshuffle.", icon="📚")

    st.subheader("Per-question review")
    for n, bi in enumerate(order, start=1):
        q = QUIZ_BANK[bi]
        chosen = answers.get(bi)
        right = chosen == q.correct_index
        icon = "✅" if right else "❌"
        with st.expander(f"{icon} Q{n} · [{q.category}] {q.prompt}", expanded=not right):
            your = q.options[chosen] if chosen is not None else "— (skipped)"
            st.markdown(f"- **Your answer:** {your}")
            st.markdown(f"- **Correct answer:** {q.options[q.correct_index]}")
            st.caption(q.explanation)

    if st.button("🔄 New attempt", type="primary"):
        start_attempt(selected)
        st.rerun()
    st.stop()

# ---------------------------------------------------------------------------
# ONE QUESTION AT A TIME
# ---------------------------------------------------------------------------
bi = order[pos]
q = QUIZ_BANK[bi]

st.progress(pos / total, text=f"Question {pos + 1} of {total}")
st.caption(f"Category: **{q.category}**")
st.subheader(q.prompt)

# radio holds the user's choice for THIS question; key is per-position so it
# resets cleanly when we advance.
choice = st.radio(
    "Choose one:",
    options=list(range(len(q.options))),
    format_func=lambda i: q.options[i],
    index=None,
    key=f"{PREFIX}radio_{pos}",
)

submitted = st.session_state.get(K_SUBMITTED, False)

if not submitted:
    if st.button("Submit answer", type="primary", disabled=choice is None):
        st.session_state[K_ANSWERS][bi] = choice
        st.session_state[K_SUBMITTED] = True
        st.rerun()
else:
    chosen = st.session_state[K_ANSWERS].get(bi)
    if chosen == q.correct_index:
        st.success(f"Correct — {q.options[q.correct_index]}", icon="✅")
    else:
        st.error(
            f"Not quite. You picked **{q.options[chosen]}**; the answer is "
            f"**{q.options[q.correct_index]}**.",
            icon="❌",
        )
    # ALWAYS show the explanation — this is where the learning happens.
    st.info(q.explanation, icon="💡")

    last = pos == total - 1
    if st.button("See results 🏁" if last else "Next question →", type="primary"):
        st.session_state[K_POS] = pos + 1
        st.session_state[K_SUBMITTED] = False
        st.rerun()
