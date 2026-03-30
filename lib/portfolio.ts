export type UploadedHolding = {
  ticker: string;
  shares: number;
  cost_basis: number;
  target_weight?: number;
};

export type EnrichedHolding = UploadedHolding & {
  price: number;
  sector: string;
  marketCap: number | null;
  forwardPE: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  targetMeanPrice: number | null;
  recommendationMean: number | null;
  analystCount: number | null;
  momentum1m: number | null;
  sma50: number | null;
  sma200: number | null;
};

export function safeNum(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function scoreHolding(h: EnrichedHolding): number {
  let score = 0;

  if (h.momentum1m !== null) score += h.momentum1m > 0 ? 2 : -1;
  if (h.price && h.sma50) score += h.price > h.sma50 ? 1 : -1;
  if (h.sma50 && h.sma200) score += h.sma50 > h.sma200 ? 1 : -1;

  if (h.revenueGrowth !== null) score += h.revenueGrowth > 0.05 ? 2 : h.revenueGrowth < 0 ? -1 : 0;
  if (h.earningsGrowth !== null) score += h.earningsGrowth > 0.08 ? 2 : h.earningsGrowth < 0 ? -1 : 0;

  if (h.recommendationMean !== null) {
    score += h.recommendationMean <= 2 ? 2 : h.recommendationMean >= 3.5 ? -2 : 0;
  }

  return score;
}

export function suggestionLabel(score: number): "Add / Overweight" | "Hold / Neutral" | "Trim / Underweight" {
  if (score >= 5) return "Add / Overweight";
  if (score >= 2) return "Hold / Neutral";
  return "Trim / Underweight";
}
