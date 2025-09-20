import React from "react";
import type { Row } from "../../types";

export default function StableAuthorsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-slate-300">
            <th className="px-3 py-2 text-left font-medium border-b border-slate-800 w-14">
              #
            </th>
            <th className="px-3 py-2 text-left font-medium border-b border-slate-800">
              Автор
            </th>
            <th className="px-3 py-2 text-right font-medium border-b border-slate-800 w-40">
              Недель подряд
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rank} className="hover:bg-white/5">
              <td className="px-3 py-2 border-b border-slate-800">{r.rank}</td>
              <td className="px-3 py-2 border-b border-slate-800 break-words">
                {r.from}
              </td>
              <td className="px-3 py-2 border-b border-slate-800 text-right">
                {r.weeks ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
