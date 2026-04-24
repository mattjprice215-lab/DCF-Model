"use client";

import { MapContainer, TileLayer, GeoJSON, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import geojson from "@/data/fl-ga-counties.geojson";
import { metricLabels, type MetricKey } from "@/lib/metrics";

export function CountyMap({
  rows,
  metric,
  onSelect
}: {
  rows: Array<{ fips: string; county: string; state: string; stateRank: number; twoStateRank: number; [k: string]: string | number }>;
  metric: MetricKey;
  onSelect: (fips: string) => void;
}) {
  const byFips = new Map(rows.map((r) => [r.fips, r]));
  const values = rows.map((r) => Number(r[metric] ?? 0));
  const min = Math.min(...values);
  const max = Math.max(...values);

  const color = (value: number) => {
    const t = (value - min) / (max - min || 1);
    const hue = 220 - t * 160;
    return `hsl(${hue},70%,45%)`;
  };

  return (
    <div className="h-[560px] overflow-hidden rounded-xl border">
      <MapContainer center={[30.8, -83.4]} zoom={6} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <GeoJSON
          data={geojson as GeoJSON.FeatureCollection}
          style={(feature) => {
            const rec = feature ? byFips.get((feature.properties as { fips: string }).fips) : null;
            const v = rec ? Number(rec[metric]) : min;
            return { color: "#fff", weight: 1, fillColor: color(v), fillOpacity: 0.8 };
          }}
          onEachFeature={(feature, layer) => {
            const rec = byFips.get((feature.properties as { fips: string }).fips);
            if (!rec) return;
            layer.on({ click: () => onSelect(rec.fips) });
            layer.bindTooltip(
              `${rec.county}, ${rec.state}\n${metricLabels[metric]}: ${rec[metric]}\nState rank: #${rec.stateRank}\nTwo-state rank: #${rec.twoStateRank}`
            );
          }}
        >
          <Tooltip sticky />
        </GeoJSON>
      </MapContainer>
    </div>
  );
}
