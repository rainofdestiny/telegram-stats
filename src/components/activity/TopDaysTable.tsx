// src/components/activity/TopDaysTable.tsx
import React from "react";

type Row = { date: string; count: number };

function formatRuDate(input: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split("-");
    return `${d}.${m}.${y}`;
  }
  const dt = new Date(input);
  if (!Number.isNaN(dt.getTime())) {
    return dt.toLocaleDateString("ru-RU");
  }
  return input;
}

export default function TopDaysTable({
  rows,
  limit = 10,
}: {
  rows: Row[];
  limit?: number;
}) {
  const data = rows.slice(0, limit);

  return (
    <div className="overflow-x-auto -mx-2 md:mx-0">
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm text-slate-200">
        <thead>
          <tr className="text-slate-400">
            <th className="w-10 text-left font-normal px-3 py-2">#</th>
            <th className="text-left font-normal px-3 py-2">Дата</th>
            <th className="w-32 text-right font-normal px-3 py-2">Сообщений</th>
          </tr>
          <tr>
            <td colSpan={3} className="h-px bg-white/5" />
          </tr>
        </thead>
        <tbody>
          {data.map((r, idx) => (
            <tr key={`${r.date}-${idx}`} className="hover:bg-white/5">
              <td className="px-3 py-2 align-middle text-slate-300">
                {idx + 1}
              </td>
              <td className="px-3 py-2 align-middle">{formatRuDate(r.date)}</td>
              <td className="px-3 py-2 align-middle text-right tabular-nums">
                {r.count.toLocaleString("ru-RU")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
