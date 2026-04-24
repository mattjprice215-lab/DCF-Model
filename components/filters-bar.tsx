"use client";

import { Search } from "lucide-react";

type Props = {
  search: string;
  setSearch: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  region: string;
  setRegion: (v: string) => void;
  size: string;
  setSize: (v: string) => void;
  metro: string;
  setMetro: (v: string) => void;
};

export function FiltersBar(props: Props) {
  const selectClass = "rounded-md border px-2 py-2 text-sm";
  return (
    <section className="grid gap-2 rounded-xl border bg-slate-50 p-3 md:grid-cols-5">
      <label className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
        <input
          value={props.search}
          onChange={(e) => props.setSearch(e.target.value)}
          placeholder="Search county"
          className="w-full rounded-md border bg-white py-2 pl-8 pr-2 text-sm"
        />
      </label>
      <select value={props.state} onChange={(e) => props.setState(e.target.value)} className={selectClass}>
        <option value="ALL">All States</option>
        <option value="FL">Florida</option>
        <option value="GA">Georgia</option>
      </select>
      <input value={props.region} onChange={(e) => props.setRegion(e.target.value)} placeholder="Region" className="rounded-md border px-2 py-2 text-sm" />
      <select value={props.size} onChange={(e) => props.setSize(e.target.value)} className={selectClass}>
        <option value="ALL">All Sizes</option>
        <option value="Small">Small</option>
        <option value="Medium">Medium</option>
        <option value="Large">Large</option>
      </select>
      <select value={props.metro} onChange={(e) => props.setMetro(e.target.value)} className={selectClass}>
        <option value="ALL">Metro + Non-metro</option>
        <option value="Metro">Metro</option>
        <option value="Non-metro">Non-metro</option>
      </select>
    </section>
  );
}
