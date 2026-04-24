"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RankingsTable } from "@/components/rankings-table";
import { counties } from "@/lib/data";
import { enrichWithRanks } from "@/lib/metrics";
import { defaultWeights } from "@/lib/score";

export default function RankingsPage() {
  const rows = enrichWithRanks(counties, defaultWeights).sort((a, b) => a.twoStateRank - b.twoStateRank);
  return (
    <DashboardShell>
      <h2 className="mb-3 text-2xl font-semibold text-civic-navy">County Rankings</h2>
      <p className="mb-4 text-sm text-slate-600">Sortable combined Florida + Georgia rankings and state-specific rank fields.</p>
      <RankingsTable rows={rows} />
    </DashboardShell>
  );
}
