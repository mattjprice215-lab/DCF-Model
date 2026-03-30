import { NextRequest, NextResponse } from "next/server";
import { EnrichedHolding, UploadedHolding, safeNum } from "@/lib/portfolio";

type YahooQuoteResult = {
  symbol?: string;
  regularMarketPrice?: number;
  marketCap?: number;
  forwardPE?: number;
};

async function fetchJson<T>(url: string): Promise<T> {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "portfolio-intelligence-dashboard/1.0"
    },
    next: { revalidate: 300 }
  });

  if (!resp.ok) {
    throw new Error(`Upstream request failed: ${resp.status}`);
  }

  return (await resp.json()) as T;
}

function movingAverage(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(values.length - period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { holdings?: UploadedHolding[] };
    const holdings = body.holdings ?? [];

    const tickers = holdings.map((h) => h.ticker.toUpperCase());
    if (tickers.length === 0) {
      return NextResponse.json({ holdings: [] });
    }

    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(tickers.join(","))}`;
    const quoteData = await fetchJson<{ quoteResponse?: { result?: YahooQuoteResult[] } }>(quoteUrl);
    const quoteMap = new Map((quoteData.quoteResponse?.result ?? []).map((r) => [r.symbol ?? "", r]));

    const enriched = await Promise.all(
      holdings.map(async (holding) => {
        const ticker = holding.ticker.toUpperCase();
        const quote = quoteMap.get(ticker);

        const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=financialData,summaryProfile`;
        const summaryData = await fetchJson<{
          quoteSummary?: {
            result?: Array<{
              financialData?: {
                revenueGrowth?: { raw?: number };
                earningsGrowth?: { raw?: number };
                targetMeanPrice?: { raw?: number };
                recommendationMean?: { raw?: number };
                numberOfAnalystOpinions?: { raw?: number };
              };
              summaryProfile?: { sector?: string };
            }>;
          };
        }>(summaryUrl).catch(() => ({}));

        const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
        const chartData = await fetchJson<{
          chart?: {
            result?: Array<{
              indicators?: { quote?: Array<{ close?: Array<number | null> }> };
            }>;
          };
        }>(chartUrl).catch(() => ({}));

        const closes =
          chartData.chart?.result?.[0]?.indicators?.quote?.[0]?.close
            ?.filter((v): v is number => typeof v === "number" && Number.isFinite(v)) ?? [];

        const oneMonthLookback = closes.length >= 22 ? closes[closes.length - 22] : null;
        const latestClose = closes.length > 0 ? closes[closes.length - 1] : null;
        const momentum1m = oneMonthLookback && latestClose ? latestClose / oneMonthLookback - 1 : null;

        const summary = summaryData.quoteSummary?.result?.[0];
        const financialData = summary?.financialData;

        const enrichedHolding: EnrichedHolding = {
          ...holding,
          ticker,
          price: quote?.regularMarketPrice ?? 0,
          sector: summary?.summaryProfile?.sector ?? "Unknown",
          marketCap: safeNum(quote?.marketCap),
          forwardPE: safeNum(quote?.forwardPE),
          revenueGrowth: safeNum(financialData?.revenueGrowth?.raw),
          earningsGrowth: safeNum(financialData?.earningsGrowth?.raw),
          targetMeanPrice: safeNum(financialData?.targetMeanPrice?.raw),
          recommendationMean: safeNum(financialData?.recommendationMean?.raw),
          analystCount: safeNum(financialData?.numberOfAnalystOpinions?.raw),
          momentum1m,
          sma50: movingAverage(closes, 50),
          sma200: movingAverage(closes, 200)
        };

        return enrichedHolding;
      })
    );

    return NextResponse.json({ holdings: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
