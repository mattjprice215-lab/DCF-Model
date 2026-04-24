import { DashboardShell } from "@/components/dashboard-shell";
import { counties } from "@/lib/data";

const avg = (arr: number[]) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);

export default function ComparisonPage() {
  const fl = counties.filter((c) => c.state === "FL");
  const ga = counties.filter((c) => c.state === "GA");

  return (
    <DashboardShell>
      <h2 className="text-2xl font-semibold text-civic-navy">Florida vs Georgia Comparison</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border p-4">
          <h3 className="font-semibold">Florida ({fl.length} counties)</h3>
          <ul className="mt-2 text-sm space-y-1">
            <li>Avg crude birth rate: {avg(fl.map((r) => r.crudeBirthRate))}</li>
            <li>Avg 5-year birth trend: {avg(fl.map((r) => r.birthsChange5y))}%</li>
            <li>Avg enrollment trend: {avg(fl.map((r) => r.enrollmentChange5y))}%</li>
          </ul>
        </article>
        <article className="rounded-xl border p-4">
          <h3 className="font-semibold">Georgia ({ga.length} counties)</h3>
          <ul className="mt-2 text-sm space-y-1">
            <li>Avg crude birth rate: {avg(ga.map((r) => r.crudeBirthRate))}</li>
            <li>Avg 5-year birth trend: {avg(ga.map((r) => r.birthsChange5y))}%</li>
            <li>Avg enrollment trend: {avg(ga.map((r) => r.enrollmentChange5y))}%</li>
          </ul>
        </article>
      </div>
    </DashboardShell>
  );
}
