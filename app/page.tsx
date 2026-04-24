"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChartsPanel } from "@/components/charts-panel";
import { DashboardShell } from "@/components/dashboard-shell";
import { FiltersBar } from "@/components/filters-bar";
import { RankingsTable } from "@/components/rankings-table";
import { WeightSliders } from "@/components/weight-sliders";
import { counties, featuredCounties } from "@/lib/data";
import { enrichWithRanks, metricLabels, type MetricKey } from "@/lib/metrics";
import { classifyPipeline, defaultWeights } from "@/lib/score";

const CountyMap = dynamic(() => import("@/components/county-map").then((m) => m.CountyMap), { ssr: false });

export default function HomePage() {
  const [weights, setWeights] = useState(defaultWeights);
  const [metric, setMetric] = useState<MetricKey>("pipelineScore");
  const [search, setSearch] = useState("");
  const [state, setState] = useState("ALL");
  const [region, setRegion] = useState("");
  const [size, setSize] = useState("ALL");
  const [metro, setMetro] = useState("ALL");
  const [selectedFips, setSelectedFips] = useState("12117");

  const scored = useMemo(() => enrichWithRanks(counties, weights), [weights]);
  const filtered = useMemo(
    () =>
      scored.filter((r) => {
        if (state !== "ALL" && r.state !== state) return false;
        if (size !== "ALL" && r.sizeBucket !== size) return false;
        if (metro !== "ALL" && r.metroStatus !== metro) return false;
        if (region && !r.region.toLowerCase().includes(region.toLowerCase())) return false;
        if (search && !r.county.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [metro, region, scored, search, size, state]
  );

  const selected = filtered.find((f) => f.fips === selectedFips) ?? filtered[0];

  return (
    <DashboardShell>
      <section className="mb-4 grid gap-3 md:grid-cols-[2fr,1fr]">
        <div className="rounded-xl border p-4">
          <h2 className="text-xl font-semibold text-civic-navy">County Pipeline Pressure Map</h2>
          <p className="text-sm text-slate-600">Interactive placeholder dashboard for all Florida and Georgia counties. Replace with official source files as they are finalized.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(metricLabels).map(([k, label]) => (
              <button key={k} onClick={() => setMetric(k as MetricKey)} className={`rounded-full px-3 py-1 text-xs ${metric === k ? "bg-civic-navy text-white" : "bg-slate-100"}`}>
                {label}
              </button>
            ))}
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "fl-ga-county-pipeline-export.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-full bg-civic-green px-3 py-1 text-xs text-white"
            >
              Export CSV/JSON
            </button>
            <button onClick={() => window.print()} className="rounded-full bg-civic-amber px-3 py-1 text-xs text-white">Export county report (PDF)</button>
          </div>
        </div>
        <WeightSliders weights={weights} setWeights={setWeights} />
      </section>

      <FiltersBar search={search} setSearch={setSearch} state={state} setState={setState} region={region} setRegion={setRegion} size={size} setSize={setSize} metro={metro} setMetro={setMetro} />

      <section className="mt-4 grid gap-4 lg:grid-cols-[2fr,1fr]">
        <CountyMap rows={filtered} metric={metric} onSelect={setSelectedFips} />
        {selected ? (
          <aside className="rounded-xl border p-4">
            <h3 className="text-lg font-semibold text-civic-navy">{selected.county}, {selected.state}</h3>
            <p className="text-xs text-slate-500">Data year: {selected.year} · {selected.provisional ? "Provisional" : "Final"}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Birth rate</dt><dd>{selected.crudeBirthRate}</dd></div>
              <div className="flex justify-between"><dt>Total births</dt><dd>{selected.totalBirths}</dd></div>
              <div className="flex justify-between"><dt>State rank</dt><dd>#{selected.stateRank}</dd></div>
              <div className="flex justify-between"><dt>Two-state rank</dt><dd>#{selected.twoStateRank}</dd></div>
              <div className="flex justify-between"><dt>5-year birth trend</dt><dd>{selected.birthsChange5y}%</dd></div>
              <div className="flex justify-between"><dt>10-year birth trend</dt><dd>{selected.birthsChange10y}%</dd></div>
              <div className="flex justify-between"><dt>Population growth</dt><dd>{selected.populationGrowthRate}%</dd></div>
              <div className="flex justify-between"><dt>Under-5 population</dt><dd>{selected.under5Population.toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt>School-age population</dt><dd>{selected.schoolAgePopulation.toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt>Public enrollment trend</dt><dd>{selected.enrollmentChange5y}%</dd></div>
            </dl>
            <p className="mt-4 rounded-md bg-slate-100 p-2 text-sm font-medium">Interpretation: {classifyPipeline(selected.pipelineScore)}</p>
            <Link href={`/county/${selected.fips}`} className="mt-3 inline-block text-sm text-civic-blue underline">Open county detail dashboard</Link>
          </aside>
        ) : null}
      </section>

      {selected ? <section className="mt-4"><ChartsPanel selected={selected} peers={filtered} /></section> : null}

      <section className="mt-4">
        <h3 className="mb-2 text-lg font-semibold">County Rankings</h3>
        <RankingsTable rows={filtered.sort((a, b) => a.twoStateRank - b.twoStateRank)} />
      </section>

      <section className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm">
        <h3 className="font-semibold">Highlighted Seed Counties</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {[...featuredCounties].map((c) => <span key={c} className="rounded bg-white px-2 py-1">{c}</span>)}
        </div>
        <p className="mt-3 text-xs text-slate-600">Last updated: April 24, 2026. Source links and methodology available in dedicated pages.</p>
      </section>
    </DashboardShell>
  );
}
