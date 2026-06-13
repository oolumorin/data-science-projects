"""
06_Regression_Playground.py — fit a curve to data and feel the bias/variance trade-off.

Educational purpose: regression is "draw the best line/curve through the cloud."
This page lets the learner build that intuition two ways: on clean synthetic 1D
data where they can SEE the fit (and watch a too-high polynomial degree overfit
via the train-vs-test R² gap), and on the real, messy revenue-prediction task
where an honest R² ~0.4 teaches that some targets are just hard.
"""

import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from src.ui import bootstrap, page_header, data_status_sidebar

import numpy as np
import streamlit as st

from src.feature_engineering import get_regression_xy
from src.modeling import make_regressor, train_regressor
from src.metrics import regression_metrics, METRIC_EXPLANATIONS
from src.visualizations import (
    regression_fit_fig,
    actual_vs_predicted_fig,
    residuals_fig,
)

# -- standard page setup -----------------------------------------------------
bootstrap("Regression Playground", icon="📈")
data_status_sidebar()
page_header(
    "📈 Regression Playground",
    "Regression predicts a **number**. Start on clean synthetic data to *see* the "
    "fit and watch overfitting appear, then try the real revenue task where an "
    "honest, middling R² is the lesson.",
    stage="Training / Evaluation",
)


# ---------------------------------------------------------------------------
# cached data + training helpers (keep the UI snappy)
# ---------------------------------------------------------------------------
@st.cache_data(show_spinner=False)
def make_synthetic(n: int, noise: float, shape: str, seed: int = 42):
    """Generate a simple 1D regression dataset with a known nonlinear curve."""
    rng = np.random.default_rng(seed)
    x = np.sort(rng.uniform(-3, 3, size=n))
    if shape == "Sine wave":
        true = np.sin(1.5 * x)
    elif shape == "Cubic":
        true = 0.25 * x**3 - 0.5 * x
    else:  # "Quadratic"
        true = 0.5 * x**2 - 1.0
    y = true + rng.normal(0, noise, size=n)
    return x.reshape(-1, 1), y


@st.cache_data(show_spinner=False)
def load_revenue_xy():
    """Cache the (X, y) revenue regression matrix."""
    X, y, names = get_regression_xy("total_revenue_30d")
    return X.to_numpy(), y.to_numpy(), names


tab_syn, tab_real = st.tabs(["🧪 Synthetic 1D", "💰 Real revenue prediction"])

# ===========================================================================
# (A) SYNTHETIC 1D
# ===========================================================================
with tab_syn:
    st.markdown(
        "Pick a true curve and a regressor. The dashed line is the model's fit. "
        "Then watch the **train vs test R²** — when they diverge, you're overfitting."
    )

    c1, c2, c3 = st.columns(3)
    with c1:
        shape = st.selectbox("True curve shape", ["Sine wave", "Cubic", "Quadratic"])
    with c2:
        noise = st.slider("Noise level", 0.0, 2.0, 0.6, 0.1)
    with c3:
        kind = st.selectbox("Regressor", ["Linear", "Polynomial", "Decision Tree"])

    degree, max_depth = 2, 5
    if kind == "Polynomial":
        degree = st.slider("Polynomial degree", 1, 10, 3,
                           help="Crank this up and watch the test R² collapse — that's overfitting.")
    elif kind == "Decision Tree":
        max_depth = st.slider("Max depth", 1, 12, 4)

    X1d, y1d = make_synthetic(80, noise, shape)

    # train on a held-out split so we can report an honest test score
    res = train_regressor(X1d, y1d, kind, degree=degree, max_depth=max_depth)
    # a model fit on ALL points for the smooth curve overlay
    full_model = make_regressor(kind, degree=degree, max_depth=max_depth)
    full_model.fit(X1d, y1d)

    test_m = regression_metrics(res.y_test, res.y_pred)
    train_pred = res.model.predict(X1d)  # rough train view on full data
    train_m = regression_metrics(y1d, train_pred)

    left, right = st.columns([1.3, 1])
    with left:
        st.pyplot(regression_fit_fig(X1d, y1d, full_model, xlabel="x", ylabel="y"))
    with right:
        st.metric("Test R²", f"{test_m['r2']:.3f}")
        st.metric("Train R² (≈)", f"{train_m['r2']:.3f}")
        gap = train_m["r2"] - test_m["r2"]
        st.metric("Train − Test gap", f"{gap:.3f}",
                  help="A big positive gap means the model memorized noise.")
        st.caption(f"Test MAE {test_m['mae']:.3f} · Test RMSE {test_m['rmse']:.3f}")

    if kind == "Polynomial" and degree >= 7:
        st.warning(
            "High-degree polynomial: the curve wiggles to chase individual noisy points. "
            "Train R² looks great, test R² sags — classic **overfitting**.",
            icon="⚠️",
        )
    st.info(
        "**Bias vs variance:** too simple a model underfits (both R² low); too flexible "
        "a model overfits (train R² high, test R² low). The sweet spot generalizes.",
        icon="🎯",
    )

# ===========================================================================
# (B) REAL REVENUE PREDICTION
# ===========================================================================
with tab_real:
    st.markdown(
        "Now the real task: predict each user's **30-day revenue** from their first-week "
        "behavior. Compare three models on the same held-out split."
    )

    Xr, yr, names = load_revenue_xy()
    model_kind = st.radio(
        "Model", ["Linear", "Decision Tree", "Random Forest"], horizontal=True
    )
    depth = 5
    if model_kind == "Decision Tree":
        depth = st.slider("Tree max depth", 2, 15, 5, key="rev_depth")

    res = train_regressor(Xr, yr, model_kind, max_depth=depth)
    m = regression_metrics(res.y_test, res.y_pred)

    mc1, mc2, mc3 = st.columns(3)
    mc1.metric("MAE", f"${m['mae']:.2f}")
    mc2.metric("RMSE", f"${m['rmse']:.2f}")
    mc3.metric("R²", f"{m['r2']:.3f}")

    fc1, fc2 = st.columns(2)
    with fc1:
        st.pyplot(actual_vs_predicted_fig(res.y_test, res.y_pred))
    with fc2:
        st.pyplot(residuals_fig(res.y_test, res.y_pred))

    with st.expander("What do MAE / RMSE / R² mean?"):
        st.markdown(f"- **MAE** — {METRIC_EXPLANATIONS['mae']}")
        st.markdown(f"- **RMSE** — {METRIC_EXPLANATIONS['rmse']}")
        st.markdown(f"- **R²** — {METRIC_EXPLANATIONS['r2']}")

    st.info(
        "**Honest result:** revenue is genuinely hard to predict — R² lands around 0.4 even "
        "for Random Forest. Most users spend near nothing and a few whales dominate, so the "
        "residual plot fans out. A modest-but-real model still beats guessing the mean.",
        icon="💡",
    )
