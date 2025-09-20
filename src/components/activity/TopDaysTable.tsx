import React from "react";
import { formatISODateRU } from "../../lib/helpers";

type Row = { date: string; count: number };

export default function TopDaysTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-slate-300">
          <tr className="text-left">
            <th className="py-2 pr-3">#</th>
            <th className="py-2 pr-3">Дата</th>
            <th className="py-2 pr-3">Сообщений</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.date}-${i}`} className="border-t border-slate-800/60">
              <td className="py-2 pr-3">{i + 1}</td>
              <td className="py-2 pr-3">{formatISODateRU(r.date)}</td>
              <td className="py-2 pr-3">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
