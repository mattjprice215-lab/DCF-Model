"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";

type Row = {
  county: string;
  state: string;
  crudeBirthRate: number;
  enrollmentChange5y: number;
  birthsChange1y: number;
  birthsChange5y: number;
  birthsChange10y: number;
  pipelineScore: number;
};

export function ChartsPanel({ selected, peers }: { selected: Row; peers: Row[] }) {
  const trend = [
    { period: "1Y", value: selected.birthsChange1y },
    { period: "5Y", value: selected.birthsChange5y },
    { period: "10Y", value: selected.birthsChange10y }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="h-72 rounded-xl border p-3">
        <h3 className="mb-2 font-semibold">Birth Trend</h3>
        <ResponsiveContainer width="100%" height="90%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Line type="monotone" dataKey="value" stroke="#1F5E9C" /></LineChart></ResponsiveContainer>
      </article>
      <article className="h-72 rounded-xl border p-3">
        <h3 className="mb-2 font-semibold">County vs State Birth Rate</h3>
        <ResponsiveContainer width="100%" height="90%"><BarChart data={[selected, ...peers.filter((p) => p.state === selected.state).slice(0, 1)]}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="county" hide /><YAxis /><Tooltip /><Bar dataKey="crudeBirthRate" fill="#2A9D8F" /></BarChart></ResponsiveContainer>
      </article>
      <article className="h-72 rounded-xl border p-3">
        <h3 className="mb-2 font-semibold">Birth Rate vs Enrollment Growth</h3>
        <ResponsiveContainer width="100%" height="90%"><ScatterChart><CartesianGrid /><XAxis dataKey="crudeBirthRate" type="number" name="Birth Rate" /><YAxis dataKey="enrollmentChange5y" type="number" name="Enroll 5Y" /><Tooltip cursor={{ strokeDasharray: "3 3" }} /><Scatter data={peers} fill="#1F5E9C" /></ScatterChart></ResponsiveContainer>
      </article>
      <article className="h-72 rounded-xl border p-3">
        <h3 className="mb-2 font-semibold">Pipeline Score Heat Bars</h3>
        <ResponsiveContainer width="100%" height="90%"><BarChart data={peers.slice(0, 25)} layout="vertical"><XAxis type="number" /><YAxis dataKey="county" type="category" width={80} hide /><Tooltip /><Bar dataKey="pipelineScore">{peers.slice(0, 25).map((p) => <Cell key={p.county} fill={p.pipelineScore > 70 ? "#2A9D8F" : p.pipelineScore > 50 ? "#1F5E9C" : p.pipelineScore > 35 ? "#F4A261" : "#D64550"} />)}</Bar></BarChart></ResponsiveContainer>
      </article>
    </section>
  );
}
