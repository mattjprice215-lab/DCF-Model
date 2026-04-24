import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { counties } from "@/lib/data";
import { enrichWithRanks } from "@/lib/metrics";
import { classifyPipeline, defaultWeights } from "@/lib/score";

export default async function CountyDetailPage({ params }: { params: Promise<{ fips: string }> }) {
  const { fips } = await params;
  const row = enrichWithRanks(counties, defaultWeights).find((r) => r.fips === fips);
  if (!row) return notFound();

  return (
    <DashboardShell>
      <h2 className="text-2xl font-semibold text-civic-navy">County Detail Dashboard</h2>
      <article className="mt-4 rounded-xl border p-4">
        <h3 className="text-xl font-semibold">{row.county}, {row.state}</h3>
        <p className="text-sm text-slate-500">FIPS {row.fips} · {row.provisional ? "Provisional" : "Final"} data</p>
        <div className="mt-4 grid gap-2 md:grid-cols-2 text-sm">
          <p>Birth rate: {row.crudeBirthRate}</p><p>Total births: {row.totalBirths}</p>
          <p>State rank: #{row.stateRank}</p><p>Two-state rank: #{row.twoStateRank}</p>
          <p>5-year birth trend: {row.birthsChange5y}%</p><p>10-year birth trend: {row.birthsChange10y}%</p>
          <p>Population growth: {row.populationGrowthRate}%</p><p>Under-5 population: {row.under5Population.toLocaleString()}</p>
          <p>School-age population: {row.schoolAgePopulation.toLocaleString()}</p><p>Enrollment trend: {row.enrollmentChange5y}%</p>
        </div>
        <p className="mt-4 rounded bg-slate-100 p-2 text-sm">Interpretation: {classifyPipeline(row.pipelineScore)}</p>
      </article>
    </DashboardShell>
  );
}
