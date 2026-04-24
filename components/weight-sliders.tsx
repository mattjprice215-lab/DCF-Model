"use client";

import type { ScoreWeights } from "@/lib/types";

const labels: Record<keyof ScoreWeights, string> = {
  birthTrend: "Birth trend",
  crudeBirthRate: "Crude birth rate",
  under5Share: "Under-5 share",
  netMigration: "Net migration",
  enrollmentTrend: "Enrollment trend"
};

export function WeightSliders({ weights, setWeights }: { weights: ScoreWeights; setWeights: (w: ScoreWeights) => void }) {
  return (
    <section className="rounded-xl border p-4">
      <h3 className="font-semibold text-civic-navy">Pipeline Score Weights</h3>
      <p className="mb-3 text-xs text-slate-600">Adjust weights and rankings update instantly.</p>
      <div className="space-y-3">
        {Object.entries(weights).map(([key, value]) => (
          <label key={key} className="block">
            <div className="mb-1 flex justify-between text-sm">
              <span>{labels[key as keyof ScoreWeights]}</span>
              <span className="font-semibold">{value}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={value}
              onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
              className="w-full"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
