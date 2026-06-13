# Data Science Refresher

A **visual-first, interactive Streamlit app** for refreshing the IBM Applied Data
Science / Data Science Professional Certificate material — built for a product
manager who wants to restore practical fluency, not retake a course.

The app teaches data science as a **system**: every page attaches to one stage of
the workflow that turns a product question into a decision.

```
Business Question → Data Sources → SQL/APIs/CSVs → Cleaning → Wrangling →
EDA → Visualization → Feature Engineering → Model Selection → Training →
Evaluation → Interpretation → Dashboard / PM Memo / Decision
```

It runs entirely locally against a **synthetic game/product-analytics dataset**
stored in **SQLite** — no external APIs, no accounts.

---

## Quick start

```bash
# from the data-science-refresher/ directory
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
streamlit run app.py
```

The first run **automatically generates** the SQLite database
(`data/refresher.db`) with 5,000 synthetic users and their sessions, events,
and transactions. CSV copies are also written to `data/exports/` for
transparency. Use the **🔄 Regenerate data** button in the sidebar to rebuild it
from the fixed seed at any time.

---

## The pages

| # | Page | Workflow stage | What you do |
|---|------|----------------|-------------|
| — | **Home** | orientation | The map of the whole app |
| 01 | **Master Map** | all | Click any workflow stage: what it does, tools, mistakes, output, product payoff. Plus the descriptive→prescriptive question-type map. |
| 02 | **SQL Join Visualizer** | extraction | Run real SQL against SQLite; compare INNER/LEFT/RIGHT/FULL and watch rows appear/disappear. |
| 03 | **Pandas Lab** | wrangling | Filter, groupby, merge, pivot, and engineer a feature — with the code shown. |
| 04 | **Chart Chooser** | visualization | Pick a question type → recommended chart + a live example + the anti-pattern to avoid. |
| 05 | **Algorithm Selector** | model selection | A decision tree from "do you have a target?" to a model shortlist, with algorithm cards. |
| 06 | **Regression Playground** | training | Compare linear / polynomial / tree regressors; watch MAE, RMSE, R² and overfitting. |
| 07 | **Classification Playground** | evaluation | Predict D7 retention; tune the threshold and read the confusion matrix live. |
| 08 | **Clustering Playground** | interpretation | Segment users with K-means + PCA; pick k with the elbow and silhouette. |
| 09 | **Metrics Simulator** | evaluation | Interactive intuition for precision, recall, F1, ROC-AUC, MAE, RMSE, R², silhouette. |
| 10 | **Mini-Capstone** | all | The full applied project end-to-end → an auto-generated PM memo. |
| 11 | **Quiz Mode** | retrieval | Retrieval practice across the whole workflow. |

---

## The dataset

A synthetic game / product-analytics dataset with **realistic, learnable
patterns** — the labels are a noisy function of behaviors recorded in the raw
tables, so models genuinely recover signal (D7 retention classifies at
**AUC ≈ 0.80**; 30-day revenue regresses at **R² ≈ 0.4** — strong but honest, no
leakage).

**Tables** (SQLite, with primary/foreign keys):

- `users` — user_id, signup_date, country, device, acquisition_channel, age_band, player_type_seed
- `sessions` — session_id, user_id, session_start, duration_seconds, session_number
- `events` — event_id, user_id, timestamp, event_name, event_value
- `transactions` — transaction_id, user_id, timestamp, item_category, amount_usd, payment_type
- `labels` — user_id, retained_d7, retained_d30, total_revenue_30d, churn_risk

**Hidden patterns the learner should rediscover:**

- ↑ **Retention:** tutorial completion, 2+ sessions in the first 24h, guild join, quest completion, longer first session.
- ↑ **Monetization:** marketplace visits, item views, wallet connect, the *collector* player type, repeated sessions.
- ↑ **Churn:** starting but never finishing the tutorial, a first session under 90 seconds, no activity after day 1, no quests.

---

## Project structure

```
data-science-refresher/
├── app.py                       # Streamlit entry point / home page
├── pages/                       # one file per page (Streamlit multipage)
│   ├── 01_Master_Map.py
│   ├── 02_SQL_Join_Visualizer.py
│   ├── 03_Pandas_Lab.py
│   ├── 04_Chart_Chooser.py
│   ├── 05_Algorithm_Selector.py
│   ├── 06_Regression_Playground.py
│   ├── 07_Classification_Playground.py
│   ├── 08_Clustering_Playground.py
│   ├── 09_Metrics_Simulator.py
│   ├── 10_Mini_Capstone.py
│   └── 11_Quiz_Mode.py
├── src/                         # the engine — reusable, tested, UI-agnostic
│   ├── db.py                    # SQLite connection + query helpers
│   ├── generate_data.py         # deterministic synthetic data generator
│   ├── feature_engineering.py   # raw tables → user-level feature matrix
│   ├── modeling.py              # scikit-learn wrappers (classify/regress/cluster)
│   ├── metrics.py               # metrics + plain-English explanations
│   ├── visualizations.py        # matplotlib figures (dark theme)
│   ├── content.py               # teaching copy: stages, algorithm cards, charts
│   ├── quiz_bank.py             # quiz questions
│   └── ui.py                    # Streamlit bootstrap + header helpers
├── data/
│   ├── refresher.db             # generated on first run (git-ignored)
│   └── exports/                 # CSV copies of every table
├── notebooks/
│   └── mini_capstone.ipynb      # the capstone as a readable notebook
├── assets/diagrams/
├── requirements.txt
└── README.md
```

---

## Design principles

- **Visual-first.** Charts, tables, and interactive widgets do the teaching; prose is short.
- **Product-oriented.** Every concept connects to a retention/monetization/churn decision.
- **A refresher, not a course.** No long lectures — manipulate, observe, recall.
- **Real SQL.** A SQLite layer means joins, GROUP BY, and aggregation are practiced for real, not simulated.
- **Honest models.** No leakage; metrics land in the "learnable but not trivial" range so the lessons (overfitting, precision/recall trade-offs) actually appear.
- **Modern AI overlay.** Pages note where GenAI accelerates the workflow — as an accelerator over fundamentals, never a replacement for statistical reasoning or evaluation.

---

## The modern AI overlay

The 2019 curriculum predates LLM-assisted workflows. Where relevant, the app
surfaces a *"how I'd use AI responsibly here"* note — e.g. generating a SQL query
with an LLM, then **manually verifying row counts and inspecting outputs**. GenAI
accelerates the workflow; it does not replace data quality, statistical
reasoning, or model evaluation.

---

## Notes

- **No external API dependencies.** Everything runs offline.
- **Single user, local.** This is a personal learning tool.
- Regenerate or reset the data anytime from the sidebar; the generator is seeded, so results are reproducible.
