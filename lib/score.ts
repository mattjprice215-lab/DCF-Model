import type { CountyRecord, ScoreWeights } from "@/lib/types";

export const defaultWeights: ScoreWeights = {
  birthTrend: 35,
  crudeBirthRate: 25,
  under5Share: 15,
  netMigration: 15,
  enrollmentTrend: 10
};

const normalize = (value: number, min: number, max: number) => {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
};

export const buildPipelineScores = (rows: CountyRecord[], weights: ScoreWeights) => {
  const under5Shares = rows.map((r) => r.under5Population / r.totalPopulation);
  const births5y = rows.map((r) => r.birthsChange5y);
  const birthRates = rows.map((r) => r.crudeBirthRate);
  const migrationRates = rows.map((r) => r.netDomesticMigration / r.totalPopulation * 1000);
  const enrollmentChanges = rows.map((r) => r.enrollmentChange5y);

  const mins = {
    under5: Math.min(...under5Shares),
    trend: Math.min(...births5y),
    rate: Math.min(...birthRates),
    migration: Math.min(...migrationRates),
    enrollment: Math.min(...enrollmentChanges)
  };

  const maxs = {
    under5: Math.max(...under5Shares),
    trend: Math.max(...births5y),
    rate: Math.max(...birthRates),
    migration: Math.max(...migrationRates),
    enrollment: Math.max(...enrollmentChanges)
  };

  return rows.map((row) => {
    const normalized = {
      birthTrend: normalize(row.birthsChange5y, mins.trend, maxs.trend),
      crudeBirthRate: normalize(row.crudeBirthRate, mins.rate, maxs.rate),
      under5Share: normalize(row.under5Population / row.totalPopulation, mins.under5, maxs.under5),
      netMigration: normalize((row.netDomesticMigration / row.totalPopulation) * 1000, mins.migration, maxs.migration),
      enrollmentTrend: normalize(row.enrollmentChange5y, mins.enrollment, maxs.enrollment)
    };

    const total =
      normalized.birthTrend * weights.birthTrend +
      normalized.crudeBirthRate * weights.crudeBirthRate +
      normalized.under5Share * weights.under5Share +
      normalized.netMigration * weights.netMigration +
      normalized.enrollmentTrend * weights.enrollmentTrend;

    return {
      ...row,
      pipelineScore: Number((total / 100 * 100).toFixed(1)),
      normalized
    };
  });
};

export const classifyPipeline = (score: number): string => {
  if (score >= 70) return "Growing student pipeline";
  if (score >= 50) return "Stable student pipeline";
  if (score >= 35) return "Aging / migration-dependent growth";
  return "Weakening student pipeline";
};
