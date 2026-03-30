"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { EnrichedHolding, UploadedHolding, scoreHolding, suggestionLabel } from "@/lib/portfolio";

type PortfolioRow = EnrichedHolding & {
  marketValue: number;
  costValue: number;
  unrealizedPnl: number;
  weight: number;
  upsideToTarget: number | null;
  impliedExpectedReturn: number;
  suggestion: string;
};

function parseCsv(file: File): Promise<UploadedHolding[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = (results.data as Record<string, string>[])
            .map((row) => ({
              ticker: (row.ticker ?? "").trim().toUpperCase(),
              shares: Number(row.shares),
              cost_basis: Number(row.cost_basis),
              target_weight: row.target_weight ? Number(row.target_weight) : undefined
            }))
            .filter((r) => r.ticker && Number.isFinite(r.shares) && Number.isFinite(r.cost_basis));
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err)
    });
  });
}

export default function Home() {
  const [rawHoldings, setRawHoldings] = useState<UploadedHolding[]>([]);
  const [enriched, setEnriched] = useState<EnrichedHolding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expectedMarketReturn, setExpectedMarketReturn] = useState(0.08);
  const [cashToDeploy, setCashToDeploy] = useState(0);
  const [maxConcentration, setMaxConcentration] = useState(0.25);
  const [targetWeightInputs, setTargetWeightInputs] = useState<Record<string, number>>({});
  const [photos, setPhotos] = useState<File[]>([]);

  const rows: PortfolioRow[] = useMemo(() => {
    const totalValue = enriched.reduce((sum, h) => sum + h.shares * h.price, 0);
    return enriched.map((h) => {
      const marketValue = h.shares * h.price;
      const costValue = h.shares * h.cost_basis;
      const weight = totalValue > 0 ? marketValue / totalValue : 0;
      const upsideToTarget = h.targetMeanPrice && h.price ? h.targetMeanPrice / h.price - 1 : null;
      const growthInputs = [h.revenueGrowth, h.earningsGrowth, upsideToTarget].filter(
        (x): x is number => typeof x === "number"
      );
      const growthScore = growthInputs.length ? growthInputs.reduce((a, b) => a + b, 0) / growthInputs.length : 0;
      const impliedExpectedReturn = growthScore * 0.5 + expectedMarketReturn * 0.5;
      const suggestion = suggestionLabel(scoreHolding(h));

      return {
        ...h,
        marketValue,
        costValue,
        unrealizedPnl: marketValue - costValue,
        weight,
        upsideToTarget,
        impliedExpectedReturn,
        suggestion
      };
    });
  }, [enriched, expectedMarketReturn]);

  const totals = useMemo(() => {
    const marketValue = rows.reduce((s, r) => s + r.marketValue, 0);
    const pnl = rows.reduce((s, r) => s + r.unrealizedPnl, 0);
    const weightedReturn = rows.reduce((s, r) => s + r.weight * r.impliedExpectedReturn, 0);
    const topWeight = rows.length ? Math.max(...rows.map((r) => r.weight)) : 0;

    return { marketValue, pnl, weightedReturn, topWeight };
  }, [rows]);

  async function uploadHoldings(file: File) {
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseCsv(file);
      setRawHoldings(parsed);

      const resp = await fetch("/api/portfolio-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings: parsed })
      });
      const data = (await resp.json()) as { holdings?: EnrichedHolding[]; error?: string };

      if (!resp.ok || !data.holdings) {
        throw new Error(data.error ?? "Unable to enrich holdings.");
      }

      setEnriched(data.holdings);
      const initWeights: Record<string, number> = {};
      data.holdings.forEach((h) => {
        initWeights[h.ticker] = h.target_weight ?? 0;
      });
      setTargetWeightInputs(initWeights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload CSV");
      setEnriched([]);
    } finally {
      setLoading(false);
    }
  }

  const sectorData = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.sector, (map.get(r.sector) ?? 0) + r.marketValue));
    const total = rows.reduce((s, r) => s + r.marketValue, 0);
    return [...map.entries()].map(([sector, value]) => ({ sector, weight: total ? value / total : 0 }));
  }, [rows]);

  const concentrationBreaches = rows.filter((r) => r.weight > maxConcentration);

  const normalizedTargets = useMemo(() => {
    const total = rows.reduce((sum, row) => sum + (targetWeightInputs[row.ticker] ?? row.weight), 0);
    return rows.map((row) => {
      const chosen = targetWeightInputs[row.ticker] ?? row.weight;
      const normalized = total > 0 ? chosen / total : 0;
      return { ...row, chosenTargetWeight: normalized };
    });
  }, [rows, targetWeightInputs]);

  const simulation = useMemo(() => {
    const currentTotal = rows.reduce((s, r) => s + r.marketValue, 0);
    const newTotal = currentTotal + cashToDeploy;

    return normalizedTargets.map((r) => {
      const projectedValue = r.chosenTargetWeight * newTotal;
      const tradeNeeded = projectedValue - r.marketValue;
      return {
        ...r,
        projectedValue,
        tradeNeeded,
        projectedContribution: r.chosenTargetWeight * r.impliedExpectedReturn
      };
    });
  }, [rows, normalizedTargets, cashToDeploy]);

  const projectedReturn = simulation.reduce((s, r) => s + r.projectedContribution, 0);

  return (
    <main className="container">
      <h1>📊 Portfolio Intelligence Dashboard</h1>
      <p className="subtle">
        Concentration, growth expectations, scenario simulations, and suggestions from technicals, fundamentals,
        and analyst consensus.
      </p>

      <section className="card controls">
        <div>
          <h3>1) Upload holdings CSV</h3>
          <p className="subtle">Required columns: ticker, shares, cost_basis. Optional: target_weight.</p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadHoldings(file);
            }}
          />
        </div>

        <div>
          <h3>2) Assumptions</h3>
          <label>
            Base expected market return (%): {Math.round(expectedMarketReturn * 1000) / 10}
            <input
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={expectedMarketReturn * 100}
              onChange={(e) => setExpectedMarketReturn(Number(e.target.value) / 100)}
            />
          </label>
          <label>
            Cash to deploy ($)
            <input
              type="number"
              value={cashToDeploy}
              min={0}
              step={100}
              onChange={(e) => setCashToDeploy(Number(e.target.value))}
            />
          </label>
          <label>
            Max single-position concentration (%): {Math.round(maxConcentration * 100)}
            <input
              type="range"
              min={5}
              max={60}
              step={1}
              value={maxConcentration * 100}
              onChange={(e) => setMaxConcentration(Number(e.target.value) / 100)}
            />
          </label>
        </div>

        <div>
          <h3>3) Add photos</h3>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotos(e.target.files ? Array.from(e.target.files) : [])}
          />
          <p className="subtle">Attach screenshots/notes for your investment thesis.</p>
        </div>
      </section>

      {loading && <p>Loading market, technical, fundamental, and analyst data...</p>}
      {error && <p className="error">{error}</p>}

      {rows.length > 0 && (
        <>
          <section className="kpis">
            <article className="card">
              <h4>Portfolio Market Value</h4>
              <strong>${totals.marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
            </article>
            <article className="card">
              <h4>Unrealized P&L</h4>
              <strong>${totals.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
            </article>
            <article className="card">
              <h4>Weighted Expected Return</h4>
              <strong>{(totals.weightedReturn * 100).toFixed(1)}%</strong>
            </article>
            <article className="card">
              <h4>Top Position Weight</h4>
              <strong>{(totals.topWeight * 100).toFixed(1)}%</strong>
            </article>
          </section>

          <section className="grid-two">
            <article className="card">
              <h3>Position Concentration</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={rows} dataKey="marketValue" nameKey="ticker" outerRadius={100} label>
                    {rows.map((entry) => (
                      <Cell key={entry.ticker} fill="#4f46e5" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </article>

            <article className="card">
              <h3>Sector Exposure</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorData}>
                  <XAxis dataKey="sector" />
                  <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
                  <Bar dataKey="weight" fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </article>
          </section>

          {concentrationBreaches.length > 0 && (
            <p className="warning">
              Concentration alert: {concentrationBreaches.map((r) => `${r.ticker} (${(r.weight * 100).toFixed(1)}%)`).join(", ")}
            </p>
          )}

          <section className="card">
            <h3>Growth, Fundamentals, Technicals & Analyst Signals</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Market Value</th>
                    <th>Weight</th>
                    <th>Rev Growth</th>
                    <th>Earnings Growth</th>
                    <th>Forward PE</th>
                    <th>1M Momentum</th>
                    <th>Upside to Target</th>
                    <th>Recommendation</th>
                    <th>Analysts</th>
                    <th>Expected Return</th>
                    <th>Suggestion</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.ticker}>
                      <td>{r.ticker}</td>
                      <td>${r.marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td>{(r.weight * 100).toFixed(1)}%</td>
                      <td>{r.revenueGrowth !== null ? `${(r.revenueGrowth * 100).toFixed(1)}%` : "-"}</td>
                      <td>{r.earningsGrowth !== null ? `${(r.earningsGrowth * 100).toFixed(1)}%` : "-"}</td>
                      <td>{r.forwardPE !== null ? r.forwardPE.toFixed(1) : "-"}</td>
                      <td>{r.momentum1m !== null ? `${(r.momentum1m * 100).toFixed(1)}%` : "-"}</td>
                      <td>{r.upsideToTarget !== null ? `${(r.upsideToTarget * 100).toFixed(1)}%` : "-"}</td>
                      <td>{r.recommendationMean !== null ? r.recommendationMean.toFixed(2) : "-"}</td>
                      <td>{r.analystCount !== null ? r.analystCount.toFixed(0) : "-"}</td>
                      <td>{(r.impliedExpectedReturn * 100).toFixed(1)}%</td>
                      <td>{r.suggestion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h3>Scenario Simulator</h3>
            <p className="subtle">Set desired weights. The app auto-normalizes them to 100% and calculates needed trades.</p>
            <div className="weight-grid">
              {rows.map((r) => (
                <label key={`weight-${r.ticker}`}>
                  {r.ticker} target weight (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={Math.round((targetWeightInputs[r.ticker] ?? r.weight) * 100)}
                    onChange={(e) =>
                      setTargetWeightInputs((prev) => ({
                        ...prev,
                        [r.ticker]: Number(e.target.value) / 100
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Current Value</th>
                    <th>Projected Value</th>
                    <th>Trade Needed</th>
                    <th>Normalized Weight</th>
                    <th>Projected Return Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {simulation.map((r) => (
                    <tr key={`sim-${r.ticker}`}>
                      <td>{r.ticker}</td>
                      <td>${r.marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td>${r.projectedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td>${r.tradeNeeded.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td>{(r.chosenTargetWeight * 100).toFixed(1)}%</td>
                      <td>{(r.projectedContribution * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              <strong>Projected Portfolio Return (1y): {(projectedReturn * 100).toFixed(1)}%</strong>
            </p>
          </section>

          <section className="card">
            <h3>Action Summary</h3>
            <p>
              <strong>Add / Overweight:</strong>{" "}
              {rows
                .filter((r) => r.suggestion === "Add / Overweight")
                .map((r) => r.ticker)
                .join(", ") || "None"}
            </p>
            <p>
              <strong>Hold / Neutral:</strong>{" "}
              {rows
                .filter((r) => r.suggestion === "Hold / Neutral")
                .map((r) => r.ticker)
                .join(", ") || "None"}
            </p>
            <p>
              <strong>Trim / Underweight:</strong>{" "}
              {rows
                .filter((r) => r.suggestion === "Trim / Underweight")
                .map((r) => r.ticker)
                .join(", ") || "None"}
            </p>
          </section>

          {photos.length > 0 && (
            <section className="card">
              <h3>Uploaded Thesis Photos</h3>
              <div className="photo-grid">
                {photos.map((photo) => (
                  <figure key={photo.name}>
                    <img src={URL.createObjectURL(photo)} alt={photo.name} />
                    <figcaption>{photo.name}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {rawHoldings.length === 0 && !loading && <p className="subtle">Upload your holdings file to get started.</p>}
    </main>
  );
}
