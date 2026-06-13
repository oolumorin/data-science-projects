"""
generate_data.py — deterministic synthetic game/product analytics data.

Educational purpose: a refresher is only useful if the data contains *real,
learnable* structure. This module fabricates five related tables (users,
sessions, events, transactions, labels) whose labels are a noisy function of
behaviors that are themselves recorded in the raw tables. That means a model
trained on features extracted from events/sessions can genuinely recover the
hidden signal — overfitting, underfitting, precision/recall trade-offs and
clustering all behave the way the curriculum says they should.

Hidden data-generating logic (the patterns the learner should rediscover):

  Higher D7 retention:  tutorial_complete, 2+ sessions in first 24h,
                        guild_join, quest_complete, longer first session.
  Higher monetization:  marketplace_visit, item_view, wallet_connect,
                        'collector' player type, repeated sessions.
  Higher churn risk:    tutorial_start but never completed, first session
                        under 90 seconds, no activity after day 1, no quests.

Everything is seeded, so the database is reproducible.
"""

from __future__ import annotations

from datetime import datetime, timedelta

import numpy as np
import pandas as pd

from src.db import EXPORTS_DIR, TABLES, get_connection

# ---------------------------------------------------------------------------
# configuration
# ---------------------------------------------------------------------------
N_USERS = 5000
SIGNUP_START = datetime(2026, 1, 1)
SIGNUP_WINDOW_DAYS = 60  # signups spread across Jan–Feb 2026

COUNTRIES = ["United States", "Canada", "United Kingdom", "Germany", "Brazil", "Japan", "India"]
COUNTRY_P = [0.30, 0.12, 0.12, 0.10, 0.12, 0.12, 0.12]
DEVICES = ["iOS", "Android", "Web"]
DEVICE_P = [0.42, 0.43, 0.15]
CHANNELS = ["organic", "paid_social", "referral", "store_feature", "influencer"]
CHANNEL_P = [0.34, 0.28, 0.14, 0.12, 0.12]
AGE_BANDS = ["18-24", "25-34", "35-44", "45-54", "55+"]
AGE_P = [0.26, 0.34, 0.22, 0.12, 0.06]
PLAYER_TYPES = ["casual", "competitive", "collector"]
PLAYER_P = [0.55, 0.30, 0.15]

# channels differ in user quality (organic/referral retain better than paid)
CHANNEL_QUALITY = {
    "organic": 0.55,
    "paid_social": -0.35,
    "referral": 0.45,
    "store_feature": 0.10,
    "influencer": -0.10,
}
PLAYER_ENGAGE = {"casual": -0.15, "competitive": 0.45, "collector": 0.25}
PLAYER_SPEND = {"casual": -0.30, "competitive": 0.15, "collector": 0.95}

EVENT_NAMES = [
    "signup", "tutorial_start", "tutorial_complete", "level_complete",
    "quest_complete", "guild_join", "item_view", "item_purchase",
    "wallet_connect", "marketplace_visit", "share_invite",
]
ITEM_CATEGORIES = ["cosmetic", "booster", "expansion", "currency", "battlepass"]
ITEM_PRICE = {"cosmetic": 4.99, "booster": 2.99, "expansion": 14.99, "currency": 9.99, "battlepass": 9.99}


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def generate_frames(seed: int = 42) -> dict[str, pd.DataFrame]:
    """Build all five tables in memory and return them keyed by table name."""
    rng = np.random.default_rng(seed)

    # -- users -------------------------------------------------------------
    user_ids = [f"U{str(i + 1).zfill(5)}" for i in range(N_USERS)]
    signup_offsets = rng.integers(0, SIGNUP_WINDOW_DAYS, size=N_USERS)
    signup_dates = [SIGNUP_START + timedelta(days=int(o)) for o in signup_offsets]
    country = rng.choice(COUNTRIES, size=N_USERS, p=COUNTRY_P)
    device = rng.choice(DEVICES, size=N_USERS, p=DEVICE_P)
    channel = rng.choice(CHANNELS, size=N_USERS, p=CHANNEL_P)
    age_band = rng.choice(AGE_BANDS, size=N_USERS, p=AGE_P)
    player_type = rng.choice(PLAYER_TYPES, size=N_USERS, p=PLAYER_P)

    users = pd.DataFrame({
        "user_id": user_ids,
        "signup_date": [d.strftime("%Y-%m-%d") for d in signup_dates],
        "country": country,
        "device": device,
        "acquisition_channel": channel,
        "age_band": age_band,
        "player_type_seed": player_type,
    })

    # -- latent engagement & spend propensities ----------------------------
    # These latent scores are NEVER stored; they only drive observable behavior.
    q = np.array([CHANNEL_QUALITY[c] for c in channel])
    pe = np.array([PLAYER_ENGAGE[p] for p in player_type])
    ps = np.array([PLAYER_SPEND[p] for p in player_type])
    engage = q + pe + rng.normal(0, 0.6, N_USERS)          # latent engagement
    spend_lat = 0.5 * engage + ps + rng.normal(0, 0.6, N_USERS)  # latent spend

    # -- observable behaviors (derived from latent + noise) ----------------
    completed_tutorial = rng.random(N_USERS) < _sigmoid(1.0 + 1.4 * engage)
    # users who never even start the tutorial are rare
    started_tutorial = completed_tutorial | (rng.random(N_USERS) < 0.85)

    first_session_duration = np.clip(
        rng.lognormal(mean=5.0 + 0.35 * engage, sigma=0.55), 20, 4000
    ).astype(int)  # seconds; short sessions (<90s) cluster among low-engagement users

    sessions_24h = rng.poisson(np.clip(0.8 + 0.9 * _sigmoid(engage) * 3, 0.3, 5)).astype(int)
    sessions_24h = np.clip(sessions_24h, 0, 8)
    total_sessions_7d = sessions_24h + rng.poisson(np.clip(1.5 + 2.5 * _sigmoid(engage) * 2, 0.5, 12))
    total_sessions_7d = np.clip(total_sessions_7d, 1, 40)

    guild_join = rng.random(N_USERS) < _sigmoid(-0.4 + 1.2 * engage)
    quest_complete = (rng.random(N_USERS) < _sigmoid(0.2 + 1.3 * engage)) & completed_tutorial
    level_complete_ct = np.where(completed_tutorial, rng.poisson(np.clip(2 + 3 * _sigmoid(engage), 0, 12)), 0)

    # monetization funnel signals
    item_view = rng.random(N_USERS) < _sigmoid(0.0 + 1.1 * spend_lat)
    marketplace_visit = rng.random(N_USERS) < _sigmoid(-0.3 + 1.2 * spend_lat)
    wallet_connect = rng.random(N_USERS) < _sigmoid(-0.8 + 1.0 * spend_lat)
    share_invite = rng.random(N_USERS) < _sigmoid(-0.6 + 0.8 * engage)

    # purchase propensity needs intent (view/marketplace) AND ability (wallet)
    purchase_logit = (
        -1.2 + 1.3 * spend_lat
        + 0.6 * item_view + 0.5 * marketplace_visit + 0.7 * wallet_connect
    )
    purchases_7d = np.where(
        rng.random(N_USERS) < _sigmoid(purchase_logit),
        rng.poisson(np.clip(0.8 + 1.5 * _sigmoid(spend_lat), 0.3, 6)) + 1,
        0,
    )

    # -- TRUE label model (noisy fn of the behaviors above) ----------------
    retain_logit = (
        -1.8
        + 1.3 * completed_tutorial
        + 0.9 * (sessions_24h >= 2)
        + 0.8 * guild_join
        + 0.7 * quest_complete
        + 0.55 * (np.log(first_session_duration) - 5.5)
        + 0.10 * total_sessions_7d
        + rng.normal(0, 0.5, N_USERS)
    )
    retained_d7 = (rng.random(N_USERS) < _sigmoid(retain_logit)).astype(int)
    # 30-day retention is correlated with d7 but harder
    retained_d30 = (
        (rng.random(N_USERS) < _sigmoid(retain_logit - 0.8 + 0.6 * retained_d7))
    ).astype(int)

    return _assemble(
        rng, users, signup_dates, started_tutorial, completed_tutorial,
        first_session_duration, sessions_24h, total_sessions_7d, guild_join,
        quest_complete, level_complete_ct, item_view, marketplace_visit,
        wallet_connect, share_invite, purchases_7d, spend_lat, retained_d7,
        retained_d30,
    )


def _assemble(
    rng, users, signup_dates, started_tutorial, completed_tutorial,
    first_session_duration, sessions_24h, total_sessions_7d, guild_join,
    quest_complete, level_complete_ct, item_view, marketplace_visit,
    wallet_connect, share_invite, purchases_7d, spend_lat, retained_d7,
    retained_d30,
):
    """Expand per-user behaviors into sessions/events/transactions rows."""
    user_ids = users["user_id"].tolist()

    session_rows = []
    event_rows = []
    txn_rows = []
    revenue_30d = np.zeros(len(user_ids))
    churn_risk = []

    sid = 0
    eid = 0
    tid = 0

    for i, uid in enumerate(user_ids):
        signup = signup_dates[i]

        # ---- sessions ----------------------------------------------------
        n_sessions = int(total_sessions_7d[i])
        # spread sessions across the first 7 days; first cluster in first 24h
        for s in range(n_sessions):
            if s < sessions_24h[i]:
                offset = timedelta(hours=float(rng.uniform(0, 24)))
            else:
                offset = timedelta(days=float(rng.uniform(1, 7)), hours=float(rng.uniform(0, 24)))
            start = signup + offset
            if s == 0:
                start = signup + timedelta(minutes=float(rng.uniform(0, 30)))
                duration = int(first_session_duration[i])
            else:
                duration = int(np.clip(rng.lognormal(5.4 + 0.2 * spend_lat[i], 0.5), 30, 5000))
            sid += 1
            session_rows.append({
                "session_id": f"S{str(sid).zfill(6)}",
                "user_id": uid,
                "session_start": start.strftime("%Y-%m-%d %H:%M:%S"),
                "duration_seconds": duration,
                "session_number": s + 1,
            })

        # ---- events ------------------------------------------------------
        def add_event(name, ts, value=1.0):
            nonlocal eid
            eid += 1
            event_rows.append({
                "event_id": f"E{str(eid).zfill(7)}",
                "user_id": uid,
                "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
                "event_name": name,
                "event_value": float(value),
            })

        add_event("signup", signup)
        t0 = signup + timedelta(minutes=float(rng.uniform(1, 10)))
        if started_tutorial[i]:
            add_event("tutorial_start", t0)
        if completed_tutorial[i]:
            add_event("tutorial_complete", t0 + timedelta(minutes=float(rng.uniform(2, 20))))
        for lc in range(int(level_complete_ct[i])):
            add_event("level_complete", signup + timedelta(hours=float(rng.uniform(0, 120))), value=lc + 1)
        if quest_complete[i]:
            add_event("quest_complete", signup + timedelta(hours=float(rng.uniform(1, 100))))
        if guild_join[i]:
            add_event("guild_join", signup + timedelta(hours=float(rng.uniform(1, 96))))
        if item_view[i]:
            for _ in range(int(rng.integers(1, 5))):
                add_event("item_view", signup + timedelta(hours=float(rng.uniform(0, 140))))
        if marketplace_visit[i]:
            for _ in range(int(rng.integers(1, 4))):
                add_event("marketplace_visit", signup + timedelta(hours=float(rng.uniform(0, 140))))
        if wallet_connect[i]:
            add_event("wallet_connect", signup + timedelta(hours=float(rng.uniform(1, 100))))
        if share_invite[i]:
            add_event("share_invite", signup + timedelta(hours=float(rng.uniform(1, 140))))

        # ---- transactions ------------------------------------------------
        n_txn = int(purchases_7d[i])
        for _ in range(n_txn):
            cat = rng.choice(ITEM_CATEGORIES, p=[0.4, 0.2, 0.12, 0.18, 0.10])
            base = ITEM_PRICE[cat]
            amount = round(float(base * rng.uniform(0.8, 2.2)), 2)
            ts = signup + timedelta(days=float(rng.uniform(0, 30)))
            pay = "wallet" if wallet_connect[i] and rng.random() < 0.6 else "card"
            tid += 1
            txn_rows.append({
                "transaction_id": f"T{str(tid).zfill(6)}",
                "user_id": uid,
                "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
                "item_category": cat,
                "amount_usd": amount,
                "payment_type": pay,
            })
            add_event("item_purchase", ts, value=amount)
            revenue_30d[i] += amount

        # ---- churn risk bucket (derived from churn drivers) --------------
        churn_score = (
            1.2 * (started_tutorial[i] and not completed_tutorial[i])
            + 1.1 * (first_session_duration[i] < 90)
            + 0.9 * (total_sessions_7d[i] <= 1)
            + 0.7 * (not quest_complete[i])
            - 0.8 * guild_join[i]
        )
        if churn_score >= 2.0:
            churn_risk.append("high")
        elif churn_score >= 1.0:
            churn_risk.append("medium")
        else:
            churn_risk.append("low")

    labels = pd.DataFrame({
        "user_id": user_ids,
        "retained_d7": retained_d7.astype(int),
        "retained_d30": retained_d30.astype(int),
        "total_revenue_30d": np.round(revenue_30d, 2),
        "churn_risk": churn_risk,
    })

    return {
        "users": users,
        "sessions": pd.DataFrame(session_rows),
        "events": pd.DataFrame(event_rows),
        "transactions": pd.DataFrame(txn_rows),
        "labels": labels,
    }


_SCHEMA = """
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    signup_date TEXT NOT NULL,
    country TEXT,
    device TEXT,
    acquisition_channel TEXT,
    age_band TEXT,
    player_type_seed TEXT
);
CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_start TEXT NOT NULL,
    duration_seconds INTEGER,
    session_number INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE events (
    event_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_value REAL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE transactions (
    transaction_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    item_category TEXT,
    amount_usd REAL,
    payment_type TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE labels (
    user_id TEXT PRIMARY KEY,
    retained_d7 INTEGER,
    retained_d30 INTEGER,
    total_revenue_30d REAL,
    churn_risk TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
"""


def generate_and_write(seed: int = 42, export_csv: bool = True) -> dict[str, pd.DataFrame]:
    """
    Generate the synthetic data and persist it to SQLite (and optional CSVs).

    Educational purpose: this is the 'data engineering' step — raw tables land
    in a real relational store with primary/foreign keys, ready for SQL.
    """
    frames = generate_frames(seed=seed)

    with get_connection() as conn:
        cur = conn.cursor()
        # disable FK enforcement while we tear down and rebuild the schema,
        # otherwise dropping a parent table that children reference errors out
        cur.execute("PRAGMA foreign_keys = OFF;")
        for t in reversed(TABLES):  # drop children before parents
            cur.execute(f"DROP TABLE IF EXISTS {t};")
        cur.executescript(_SCHEMA)
        for t in TABLES:
            frames[t].to_sql(t, conn, if_exists="append", index=False)
        conn.commit()

    if export_csv:
        EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
        for t in TABLES:
            frames[t].to_csv(EXPORTS_DIR / f"{t}.csv", index=False)

    return frames


if __name__ == "__main__":
    fr = generate_and_write()
    for name, df in fr.items():
        print(f"{name:14s} {len(df):>7,} rows")
    print("\nD7 retention rate:", round(fr["labels"]["retained_d7"].mean(), 3))
    print("Users with revenue >0:", int((fr["labels"]["total_revenue_30d"] > 0).sum()))
    print("Churn risk mix:\n", fr["labels"]["churn_risk"].value_counts())
