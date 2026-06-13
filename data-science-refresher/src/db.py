"""
db.py — the single data-access layer for the Data Science Refresher.

Educational purpose: in a real product analytics workflow your data lives in a
database, not a pile of CSVs. This module centralizes the SQLite connection so
every page pulls from the same `refresher.db` file using real SQL. Keeping all
DB access here (rather than sprinkling sqlite3 calls across pages) mirrors how a
production codebase isolates its data layer.
"""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path

import pandas as pd

# Resolve paths relative to the project root so the app works no matter which
# directory Streamlit is launched from.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = DATA_DIR / "refresher.db"
EXPORTS_DIR = DATA_DIR / "exports"

TABLES = ["users", "sessions", "events", "transactions", "labels"]


def get_connection() -> sqlite3.Connection:
    """Open a connection to the SQLite database, creating the folder if needed."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    # enforce foreign keys so the relational schema actually behaves relationally
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def database_exists() -> bool:
    """True only if the DB file exists AND has all expected tables populated."""
    if not DB_PATH.exists():
        return False
    try:
        with get_connection() as conn:
            existing = pd.read_sql(
                "SELECT name FROM sqlite_master WHERE type='table';", conn
            )["name"].tolist()
        return all(t in existing for t in TABLES)
    except Exception:
        return False


def run_query(sql: str, params: tuple | dict | None = None) -> pd.DataFrame:
    """Run a SQL query and return a DataFrame. The workhorse for every page."""
    with get_connection() as conn:
        return pd.read_sql(sql, conn, params=params)


def load_table(name: str) -> pd.DataFrame:
    """Load a whole table by name (validated against the known schema)."""
    if name not in TABLES:
        raise ValueError(f"Unknown table '{name}'. Expected one of {TABLES}.")
    return run_query(f"SELECT * FROM {name};")


def ensure_database(seed: int = 42) -> None:
    """
    Make sure the database exists before any page tries to read it.

    Educational purpose: the app is self-bootstrapping — the first run generates
    a deterministic synthetic dataset so there is never a "missing data" error.
    """
    if not database_exists():
        # imported lazily to avoid a circular import (generate_data imports db)
        from src.generate_data import generate_and_write

        generate_and_write(seed=seed)


def table_overview() -> pd.DataFrame:
    """Return a small summary (row counts) of every table — handy for the UI."""
    rows = []
    for t in TABLES:
        n = run_query(f"SELECT COUNT(*) AS n FROM {t};")["n"].iloc[0]
        rows.append({"table": t, "rows": int(n)})
    return pd.DataFrame(rows)


def reset_database(seed: int = 42) -> None:
    """Delete and regenerate the database — used by the 'regenerate data' button."""
    if DB_PATH.exists():
        os.remove(DB_PATH)
    from src.generate_data import generate_and_write

    generate_and_write(seed=seed)
