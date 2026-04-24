"use client";

import { useMemo } from "react";
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";

type Row = {
  fips: string;
  county: string;
  state: string;
  pipelineScore: number;
  stateRank: number;
  twoStateRank: number;
  crudeBirthRate: number;
  totalBirths: number;
  birthsChange5y: number;
  enrollmentChange5y: number;
};

const ch = createColumnHelper<Row>();

export function RankingsTable({ rows }: { rows: Row[] }) {
  const columns = useMemo(
    () => [
      ch.accessor("twoStateRank", { header: "2-State Rank" }),
      ch.accessor("stateRank", { header: "State Rank" }),
      ch.accessor("county", { header: "County" }),
      ch.accessor("state", { header: "State" }),
      ch.accessor("pipelineScore", { header: "Pipeline" }),
      ch.accessor("crudeBirthRate", { header: "Birth Rate" }),
      ch.accessor("totalBirths", { header: "Births" }),
      ch.accessor("birthsChange5y", { header: "5y Birth %" }),
      ch.accessor("enrollmentChange5y", { header: "5y Enroll %" })
    ],
    []
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="px-3 py-2 font-semibold">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id} className="border-t">
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="px-3 py-2">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
