# Portfolio Intelligence Dashboard

A Streamlit dashboard that analyzes portfolio concentration, growth expectations, scenario changes, and rule-based suggestions using technicals, fundamentals, and analyst sentiment.

## Features

- **Holdings upload** (`ticker`, `shares`, `cost_basis`, optional `target_weight`)
- **Concentration views** by position and sector
- **Growth expectations** using blended assumptions from growth and analyst upside
- **Fundamental + analyst panel** (PE, revenue growth, earnings growth, recommendation mean, analyst count)
- **Technical score inputs** (1M momentum, price vs SMA50, SMA50 vs SMA200)
- **Scenario simulator** for new target weights and optional cash deployment
- **Action suggestions**: Add / Hold / Trim classifications via a composite heuristic score
- **Photo uploads** for thesis screenshots or notes

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

## CSV format

Required columns:

- `ticker`
- `shares`
- `cost_basis`

Optional column:

- `target_weight` (decimal form, e.g., 0.20)

You can download a sample CSV directly from the app sidebar.

## Notes

- Market/metadata source is Yahoo Finance (`yfinance`).
- Suggestions are model heuristics for planning only and **not investment advice**.
