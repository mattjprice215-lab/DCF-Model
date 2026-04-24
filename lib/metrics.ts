import { buildPipelineScores } from "@/lib/score";
import type { CountyRecord, ScoreWeights } from "@/lib/types";

export type MetricKey =
  | "pipelineScore"
  | "crudeBirthRate"
  | "totalBirths"
  | "birthsChange5y"
  | "enrollmentChange5y"
  | "populationGrowthRate";

export const metricLabels: Record<MetricKey, string> = {
  pipelineScore: "Future Student Pipeline Score",
  crudeBirthRate: "Crude Birth Rate",
  totalBirths: "Total Live Births",
  birthsChange5y: "5-Year Birth Trend",
  enrollmentChange5y: "Public Enrollment Trend",
  populationGrowthRate: "Population Growth"
};

export const enrichWithRanks = (rows: CountyRecord[], weights: ScoreWeights) => {
  const scored = buildPipelineScores(rows, weights);
  const allSorted = [...scored].sort((a, b) => b.pipelineScore - a.pipelineScore);

  return scored.map((row) => {
    const stateRows = scored.filter((r) => r.state === row.state).sort((a, b) => b.pipelineScore - a.pipelineScore);
    return {
      ...row,
      stateRank: stateRows.findIndex((r) => r.fips === row.fips) + 1,
      twoStateRank: allSorted.findIndex((r) => r.fips === row.fips) + 1
    };
  });
};
