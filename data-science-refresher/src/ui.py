"""
ui.py — tiny Streamlit helpers shared by every page (bootstrap + headers).

Educational purpose: keeps cross-cutting concerns (making sure the database
exists, consistent page headers) in one place so each page reads as a clean
lesson, not setup boilerplate.
"""

from __future__ import annotations

import sys
from pathlib import Path

# make `import src.*` work regardless of where Streamlit launches the page from
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import streamlit as st  # noqa: E402

from src.db import ensure_database, table_overview  # noqa: E402


def bootstrap(page_title: str, icon: str = "📊") -> None:
    """
    Standard page setup: config, ensure the DB exists, render a title.

    Call this at the top of every page. The first call in a session generates
    the synthetic SQLite database if it isn't there yet (no manual setup step).
    """
    st.set_page_config(page_title=f"{page_title} · DS Refresher", page_icon=icon, layout="wide")
    with st.spinner("Preparing the synthetic product-analytics database…"):
        ensure_database()


def page_header(title: str, subtitle: str, stage: str | None = None) -> None:
    """Consistent header: where this page sits in the workflow + what it teaches."""
    st.title(title)
    if stage:
        st.caption(f"📍 Workflow stage: **{stage}**")
    st.markdown(subtitle)
    st.divider()


def data_status_sidebar() -> None:
    """Show table row counts + a regenerate button in the sidebar."""
    with st.sidebar:
        st.markdown("### 🗄️ Database")
        try:
            ov = table_overview()
            for _, row in ov.iterrows():
                st.caption(f"`{row['table']}` — {row['rows']:,} rows")
        except Exception:
            st.caption("database not ready")
        if st.button("🔄 Regenerate data", help="Delete and rebuild refresher.db from a fixed seed"):
            from src.db import reset_database

            reset_database()
            st.success("Database regenerated.")
            st.rerun()


def ai_callout(text: str) -> None:
    """
    The 'how I'd use AI responsibly here' sidebar note (Module 11 overlay).

    Educational purpose: GenAI is an accelerator over fundamentals, not a
    replacement for statistical reasoning — every page can surface one concrete,
    verify-it-yourself example.
    """
    with st.sidebar:
        st.markdown("### 🤖 AI overlay")
        st.info(text)
