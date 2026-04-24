import { DashboardShell } from "@/components/dashboard-shell";

export default function MethodologyPage() {
  return (
    <DashboardShell>
      <h2 className="text-2xl font-semibold text-civic-navy">Methodology & Data Notes</h2>
      <div className="prose mt-4 max-w-none prose-slate">
        <h3>Metric definitions</h3>
        <ul>
          <li><strong>Crude birth rate</strong>: births per 1,000 total residents.</li>
          <li><strong>Fertility rate</strong>: births per 1,000 women ages 15-44 when available.</li>
          <li><strong>Total births</strong>: absolute annual live birth count.</li>
          <li><strong>Natural increase</strong>: births minus deaths (not directly shown but related).</li>
        </ul>
        <h3>Interpretation guidance</h3>
        <ul>
          <li>High population growth can occur with low birth rate if migration is strong.</li>
          <li>School enrollment can fall while population rises due to aging households or private/virtual shifts.</li>
          <li>Rankings shift by metric and weighting choices; use multi-metric review for planning decisions.</li>
        </ul>
        <h3>Future Student Pipeline Score</h3>
        <p>Default weights: 35% recent birth trend, 25% crude birth rate, 15% under-5 share, 15% net migration, and 10% school enrollment trend. Users can change these weights live.</p>
        <h3>Data source roadmap</h3>
        <ul>
          <li>CDC / NCHS natality microdata and annual summaries.</li>
          <li>Florida Department of Health and Florida Health Charts.</li>
          <li>Georgia Department of Public Health OASIS.</li>
          <li>U.S. Census ACS and Population Estimates Program.</li>
          <li>Florida DOE and Georgia DOE enrollment files.</li>
        </ul>
        <p><strong>Placeholder note:</strong> this starter uses synthetic placeholder values for full-county scaffolding and UI behavior testing. Replace with official extracts during production data pipeline setup.</p>
      </div>
    </DashboardShell>
  );
}
