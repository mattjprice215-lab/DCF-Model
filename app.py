import math
from dataclasses import dataclass
from typing import Dict, List

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
import yfinance as yf


st.set_page_config(page_title="Portfolio Intelligence Dashboard", layout="wide")


@dataclass
class Position:
    ticker: str
    shares: float
    cost_basis: float
    target_weight: float


def parse_positions(uploaded: pd.DataFrame) -> List[Position]:
    required = ["ticker", "shares", "cost_basis"]
    missing = [c for c in required if c not in uploaded.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    if "target_weight" not in uploaded.columns:
        uploaded["target_weight"] = np.nan

    positions: List[Position] = []
    for _, row in uploaded.iterrows():
        if pd.isna(row["ticker"]) or pd.isna(row["shares"]) or pd.isna(row["cost_basis"]):
            continue
        positions.append(
            Position(
                ticker=str(row["ticker"]).strip().upper(),
                shares=float(row["shares"]),
                cost_basis=float(row["cost_basis"]),
                target_weight=float(row["target_weight"]) if not pd.isna(row["target_weight"]) else np.nan,
            )
        )
    return positions


def fetch_quote_and_meta(tickers: List[str]) -> Dict[str, dict]:
    data: Dict[str, dict] = {}
    for t in tickers:
        tk = yf.Ticker(t)
        hist = tk.history(period="6mo", interval="1d")
        info = tk.info if tk.info else {}

        current_price = float(hist["Close"].iloc[-1]) if not hist.empty else np.nan
        sma50 = float(hist["Close"].rolling(50).mean().iloc[-1]) if len(hist) >= 50 else np.nan
        sma200 = float(hist["Close"].rolling(200).mean().iloc[-1]) if len(hist) >= 200 else np.nan
        returns = hist["Close"].pct_change().dropna() if not hist.empty else pd.Series(dtype=float)
        annualized_vol = float(returns.std() * math.sqrt(252)) if not returns.empty else np.nan
        momentum_1m = (
            float((hist["Close"].iloc[-1] / hist["Close"].iloc[-22]) - 1)
            if len(hist) >= 22
            else np.nan
        )

        data[t] = {
            "price": current_price,
            "sma50": sma50,
            "sma200": sma200,
            "volatility": annualized_vol,
            "momentum_1m": momentum_1m,
            "sector": info.get("sector", "Unknown"),
            "industry": info.get("industry", "Unknown"),
            "beta": info.get("beta", np.nan),
            "market_cap": info.get("marketCap", np.nan),
            "forward_pe": info.get("forwardPE", np.nan),
            "revenue_growth": info.get("revenueGrowth", np.nan),
            "earnings_growth": info.get("earningsGrowth", np.nan),
            "target_mean_price": info.get("targetMeanPrice", np.nan),
            "recommendation_mean": info.get("recommendationMean", np.nan),
            "analyst_count": info.get("numberOfAnalystOpinions", np.nan),
        }
    return data


def score_row(row: pd.Series) -> float:
    score = 0.0

    if pd.notna(row["momentum_1m"]):
        score += 2 if row["momentum_1m"] > 0 else -1
    if pd.notna(row["price"]) and pd.notna(row["sma50"]):
        score += 1 if row["price"] > row["sma50"] else -1
    if pd.notna(row["sma50"]) and pd.notna(row["sma200"]):
        score += 1 if row["sma50"] > row["sma200"] else -1

    if pd.notna(row["revenue_growth"]):
        score += 2 if row["revenue_growth"] > 0.05 else (-1 if row["revenue_growth"] < 0 else 0)
    if pd.notna(row["earnings_growth"]):
        score += 2 if row["earnings_growth"] > 0.08 else (-1 if row["earnings_growth"] < 0 else 0)

    if pd.notna(row["recommendation_mean"]):
        # Lower is better in many feeds (1=strong buy, 5=sell)
        score += 2 if row["recommendation_mean"] <= 2.0 else (-2 if row["recommendation_mean"] >= 3.5 else 0)

    return score


def suggestion_label(score: float) -> str:
    if score >= 5:
        return "Add / Overweight"
    if score >= 2:
        return "Hold / Neutral"
    return "Trim / Underweight"


def generate_template() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "ticker": ["AAPL", "MSFT", "VOO"],
            "shares": [20, 12, 40],
            "cost_basis": [150, 280, 360],
            "target_weight": [0.25, 0.25, 0.50],
        }
    )


st.title("📊 Portfolio Intelligence Dashboard")
st.caption(
    "Upload holdings, analyze concentration risk, evaluate expected growth, and simulate allocation changes "
    "using technical, fundamental, and analyst inputs."
)

with st.sidebar:
    st.header("1) Holdings Input")
    st.download_button(
        "Download sample template",
        generate_template().to_csv(index=False).encode("utf-8"),
        file_name="portfolio_template.csv",
        mime="text/csv",
    )
    upload = st.file_uploader("Upload CSV", type=["csv"])

    st.header("2) Scenario Assumptions")
    expected_market_return = st.slider("Base expected market return (%)", 0.0, 20.0, 8.0, 0.5) / 100
    cash_add = st.number_input("Cash to deploy ($)", min_value=0.0, value=0.0, step=100.0)
    concentration_limit = st.slider("Max desired single-position concentration (%)", 5, 60, 25) / 100

    st.header("3) Notes & Photos")
    uploaded_images = st.file_uploader(
        "Add thesis photos / screenshots (optional)",
        type=["png", "jpg", "jpeg", "webp"],
        accept_multiple_files=True,
    )

if upload is None:
    st.info("Upload a CSV to begin. Required columns: ticker, shares, cost_basis. Optional: target_weight.")
    st.stop()

raw = pd.read_csv(upload)
positions = parse_positions(raw)
if not positions:
    st.warning("No valid rows found in your upload.")
    st.stop()

portfolio_df = pd.DataFrame([vars(p) for p in positions])
meta = fetch_quote_and_meta(portfolio_df["ticker"].tolist())
meta_df = pd.DataFrame.from_dict(meta, orient="index").reset_index().rename(columns={"index": "ticker"})

df = portfolio_df.merge(meta_df, on="ticker", how="left")
df["market_value"] = df["shares"] * df["price"]
df["cost_value"] = df["shares"] * df["cost_basis"]
df["unrealized_pnl"] = df["market_value"] - df["cost_value"]
df["weight"] = df["market_value"] / df["market_value"].sum()
df["upside_to_target"] = (df["target_mean_price"] / df["price"]) - 1

df["growth_score"] = (
    df[["revenue_growth", "earnings_growth", "upside_to_target"]]
    .fillna(0)
    .mean(axis=1)
)
df["implied_expected_return"] = df["growth_score"].fillna(0) * 0.5 + expected_market_return * 0.5

df["composite_score"] = df.apply(score_row, axis=1)
df["suggestion"] = df["composite_score"].apply(suggestion_label)

# --- Top KPIs ---
col1, col2, col3, col4 = st.columns(4)
col1.metric("Portfolio Market Value", f"${df['market_value'].sum():,.0f}")
col2.metric("Unrealized P&L", f"${df['unrealized_pnl'].sum():,.0f}")
col3.metric("Weighted Expected Return", f"{(df['weight'] * df['implied_expected_return']).sum() * 100:.1f}%")
col4.metric("Top Position Weight", f"{df['weight'].max() * 100:.1f}%")

# --- Concentration ---
st.subheader("Concentration & Exposure")
left, right = st.columns([1, 1])
with left:
    pie = px.pie(df, values="market_value", names="ticker", title="Position Concentration")
    st.plotly_chart(pie, use_container_width=True)
with right:
    sector = df.groupby("sector", dropna=False)["market_value"].sum().reset_index()
    sector["weight"] = sector["market_value"] / sector["market_value"].sum()
    bar = px.bar(sector.sort_values("weight", ascending=False), x="sector", y="weight", title="Sector Exposure")
    bar.update_yaxes(tickformat=".0%")
    st.plotly_chart(bar, use_container_width=True)

breaches = df[df["weight"] > concentration_limit][["ticker", "weight"]]
if not breaches.empty:
    st.warning(
        "Concentration alert: "
        + ", ".join([f"{r.ticker} ({r.weight * 100:.1f}%)" for r in breaches.itertuples()])
        + f" exceed your {concentration_limit*100:.0f}% limit."
    )

# --- Growth, fundamentals, analysts ---
st.subheader("Growth Expectations, Fundamentals & Analyst Signals")
display_cols = [
    "ticker",
    "market_value",
    "weight",
    "revenue_growth",
    "earnings_growth",
    "forward_pe",
    "upside_to_target",
    "recommendation_mean",
    "analyst_count",
    "implied_expected_return",
    "suggestion",
]
fmt_df = df[display_cols].copy()
st.dataframe(
    fmt_df.style.format(
        {
            "market_value": "${:,.0f}",
            "weight": "{:.1%}",
            "revenue_growth": "{:.1%}",
            "earnings_growth": "{:.1%}",
            "forward_pe": "{:.1f}",
            "upside_to_target": "{:.1%}",
            "recommendation_mean": "{:.2f}",
            "implied_expected_return": "{:.1%}",
        }
    ),
    use_container_width=True,
)

# --- Simulation ---
st.subheader("Scenario Simulator")
st.caption("Adjust target weights and cash deployment; projected values update instantly.")

sim = df[["ticker", "market_value", "weight", "target_weight", "implied_expected_return"]].copy()
remaining_weight = 1.0
for i, row in sim.iterrows():
    default_weight = float(row["target_weight"]) if pd.notna(row["target_weight"]) else float(row["weight"])
    chosen = st.slider(
        f"Target weight for {row['ticker']} (%)",
        0,
        100,
        int(round(default_weight * 100)),
        key=f"tw_{row['ticker']}",
    ) / 100
    sim.at[i, "chosen_target_weight"] = chosen
    remaining_weight -= chosen

if remaining_weight < -0.02 or remaining_weight > 0.02:
    st.error(f"Target weights should sum to ~100%. Current total: {(sim['chosen_target_weight'].sum()) * 100:.1f}%")

current_total = float(sim["market_value"].sum())
new_total = current_total + cash_add
sim["projected_value"] = sim["chosen_target_weight"] * new_total
sim["trade_needed"] = sim["projected_value"] - sim["market_value"]
sim["projected_return_contribution"] = sim["chosen_target_weight"] * sim["implied_expected_return"]

st.dataframe(
    sim[[
        "ticker",
        "market_value",
        "projected_value",
        "trade_needed",
        "chosen_target_weight",
        "projected_return_contribution",
    ]].style.format(
        {
            "market_value": "${:,.0f}",
            "projected_value": "${:,.0f}",
            "trade_needed": "${:,.0f}",
            "chosen_target_weight": "{:.1%}",
            "projected_return_contribution": "{:.2%}",
        }
    ),
    use_container_width=True,
)

proj_return = sim["projected_return_contribution"].sum()
st.metric("Projected Portfolio Return (1y)", f"{proj_return * 100:.1f}%")

waterfall = go.Figure(
    go.Waterfall(
        x=sim["ticker"],
        y=sim["trade_needed"],
        measure=["relative"] * len(sim),
    )
)
waterfall.update_layout(title="Projected Trade List (Buys/Sells)", yaxis_title="USD")
st.plotly_chart(waterfall, use_container_width=True)

# --- Suggestions ---
st.subheader("Actionable Suggestions")
adds = df[df["suggestion"] == "Add / Overweight"]["ticker"].tolist()
holds = df[df["suggestion"] == "Hold / Neutral"]["ticker"].tolist()
trims = df[df["suggestion"] == "Trim / Underweight"]["ticker"].tolist()

st.write(f"**Add/Overweight:** {', '.join(adds) if adds else 'None'}")
st.write(f"**Hold/Neutral:** {', '.join(holds) if holds else 'None'}")
st.write(f"**Trim/Underweight:** {', '.join(trims) if trims else 'None'}")

if uploaded_images:
    st.subheader("Uploaded Photos / Evidence")
    for img in uploaded_images:
        st.image(img, caption=img.name, use_container_width=True)

st.caption(
    "Data source: Yahoo Finance via yfinance. Metrics and suggestions are heuristic and not investment advice."
)
