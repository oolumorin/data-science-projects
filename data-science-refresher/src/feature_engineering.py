"""
feature_engineering.py — turn raw event/session/transaction rows into one
tidy user-level feature matrix.

Educational purpose: models never see raw logs. The single most important
applied-DS skill is reshaping many-rows-per-user event data into one-row-per-user
features (the split-apply-combine / groupby muscle). Every feature here maps to a
behavior the synthetic generator actually encoded, so a model can recover signal.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from src.db import load_table

# the canonical feature list the curriculum's mini-capstone calls for
FEATURE_COLUMNS = [
    "sessions_first_24h",
    "total_sessions_7d",
    "avg_session_duration",
    "first_session_duration",
    "completed_tutorial",
    "joined_guild",
    "completed_quest",
    "marketplace_visits",
    "item_views",
    "wallet_connected",
    "purchases_7d",
    "revenue_7d",
    "event_diversity",
    "days_active_7d",
]


def build_user_features(
    users: pd.DataFrame | None = None,
    sessions: pd.DataFrame | None = None,
    events: pd.DataFrame | None = None,
    transactions: pd.DataFrame | None = None,
) -> pd.DataFrame:
    """
    Aggregate the raw tables into one row per user.

    Pass DataFrames to use them directly (handy for the Pandas Lab), or leave
    them as None to load straight from SQLite.
    """
    users = load_table("users") if users is None else users.copy()
    sessions = load_table("sessions") if sessions is None else sessions.copy()
    events = load_table("events") if events is None else events.copy()
    transactions = load_table("transactions") if transactions is None else transactions.copy()

    # parse timestamps once
    users["signup_dt"] = pd.to_datetime(users["signup_date"])
    sessions["session_start"] = pd.to_datetime(sessions["session_start"])
    events["timestamp"] = pd.to_datetime(events["timestamp"])
    transactions["timestamp"] = pd.to_datetime(transactions["timestamp"])

    feats = users[["user_id"]].copy()

    # -- session-derived features -----------------------------------------
    s = sessions.merge(users[["user_id", "signup_dt"]], on="user_id", how="left")
    s["hours_since_signup"] = (s["session_start"] - s["signup_dt"]).dt.total_seconds() / 3600.0
    s7 = s[s["hours_since_signup"] <= 7 * 24]

    sessions_24h = (
        s[s["hours_since_signup"] <= 24].groupby("user_id").size().rename("sessions_first_24h")
    )
    total_sessions_7d = s7.groupby("user_id").size().rename("total_sessions_7d")
    avg_duration = s7.groupby("user_id")["duration_seconds"].mean().rename("avg_session_duration")
    first_duration = (
        s.sort_values("session_number").groupby("user_id")["duration_seconds"].first().rename("first_session_duration")
    )
    days_active = (
        s7.assign(day=s7["session_start"].dt.date).groupby("user_id")["day"].nunique().rename("days_active_7d")
    )

    # -- event-derived features -------------------------------------------
    ev = events.merge(users[["user_id", "signup_dt"]], on="user_id", how="left")
    ev["hours_since_signup"] = (ev["timestamp"] - ev["signup_dt"]).dt.total_seconds() / 3600.0
    ev7 = ev[ev["hours_since_signup"] <= 7 * 24]

    def has_event(name: str) -> pd.Series:
        return ev7[ev7["event_name"] == name].groupby("user_id").size().clip(upper=1)

    def count_event(name: str) -> pd.Series:
        return ev7[ev7["event_name"] == name].groupby("user_id").size()

    completed_tutorial = has_event("tutorial_complete").rename("completed_tutorial")
    joined_guild = has_event("guild_join").rename("joined_guild")
    completed_quest = has_event("quest_complete").rename("completed_quest")
    wallet_connected = has_event("wallet_connect").rename("wallet_connected")
    marketplace_visits = count_event("marketplace_visit").rename("marketplace_visits")
    item_views = count_event("item_view").rename("item_views")
    event_diversity = ev7.groupby("user_id")["event_name"].nunique().rename("event_diversity")

    # -- transaction-derived features -------------------------------------
    t = transactions.merge(users[["user_id", "signup_dt"]], on="user_id", how="left")
    t["days_since_signup"] = (t["timestamp"] - t["signup_dt"]).dt.total_seconds() / 86400.0
    t7 = t[t["days_since_signup"] <= 7]
    purchases_7d = t7.groupby("user_id").size().rename("purchases_7d")
    revenue_7d = t7.groupby("user_id")["amount_usd"].sum().rename("revenue_7d")

    # -- combine, fill, type-cast -----------------------------------------
    for series in [
        sessions_24h, total_sessions_7d, avg_duration, first_duration, days_active,
        completed_tutorial, joined_guild, completed_quest, wallet_connected,
        marketplace_visits, item_views, event_diversity, purchases_7d, revenue_7d,
    ]:
        feats = feats.merge(series, on="user_id", how="left")

    feats = feats.fillna(0)
    # binary flags as ints
    for col in ["completed_tutorial", "joined_guild", "completed_quest", "wallet_connected"]:
        feats[col] = feats[col].astype(int)
    for col in ["sessions_first_24h", "total_sessions_7d", "days_active_7d",
                "marketplace_visits", "item_views", "event_diversity", "purchases_7d"]:
        feats[col] = feats[col].astype(int)

    return feats[["user_id"] + FEATURE_COLUMNS]


def build_modeling_frame() -> pd.DataFrame:
    """Join user features to labels — the ready-to-model table (X + targets)."""
    feats = build_user_features()
    labels = load_table("labels")
    return feats.merge(labels, on="user_id", how="left")


def build_eda_frame() -> pd.DataFrame:
    """
    Modeling frame enriched with user attributes + a signup_week column.

    Educational purpose: EDA needs the categorical context (channel, device,
    player type) alongside the engineered features, so the chart helpers can
    slice retention/revenue by segment.
    """
    df = build_modeling_frame()
    users = load_table("users")
    df = df.merge(
        users[["user_id", "country", "device", "acquisition_channel", "age_band", "player_type_seed", "signup_date"]],
        on="user_id", how="left",
    )
    df["signup_week"] = pd.to_datetime(df["signup_date"]).dt.to_period("W").dt.start_time
    return df


def get_classification_xy(target: str = "retained_d7"):
    """Return (X DataFrame, y Series, feature_names) for a classification task."""
    df = build_modeling_frame()
    X = df[FEATURE_COLUMNS].copy()
    y = df[target].astype(int)
    return X, y, FEATURE_COLUMNS


def get_regression_xy(target: str = "total_revenue_30d"):
    """Return (X, y, feature_names) for the revenue regression task."""
    df = build_modeling_frame()
    X = df[FEATURE_COLUMNS].copy()
    y = df[target].astype(float)
    return X, y, FEATURE_COLUMNS


if __name__ == "__main__":
    f = build_modeling_frame()
    print(f.head())
    print("\nfeature means by retention:")
    print(f.groupby("retained_d7")[FEATURE_COLUMNS].mean().T.round(2))
    print("\ncorr of revenue_7d with 30d revenue:",
          round(np.corrcoef(f["revenue_7d"], f["total_revenue_30d"])[0, 1], 3))
