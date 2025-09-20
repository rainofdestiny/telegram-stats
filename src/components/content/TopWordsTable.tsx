// src/components/content/TopWordsTable.tsx
import React from "react";

type Row = { rank: number; word: string; count: number };

export default function TopWordsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-300">
            <th className="px-4 py-2 w-10 text-left">#</th>
            <th className="px-4 py-2 text-left">Слово</th>
            <th className="px-4 py-2 w-28 text-right">Частота</th>
          </tr>
        </thead>
        {/* только горизонтальные разделители строк */}
        <tbody className="divide-y divide-slate-800">
          {rows.map((r) => (
            <tr key={r.rank}>
              <td className="px-4 py-2 text-slate-400">{r.rank}</td>
              <td className="px-4 py-2">{r.word}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {r.count.toLocaleString("ru-RU")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
