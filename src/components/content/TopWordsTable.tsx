import React from "react";

type Row = { rank: number; word: string; count: number };

export default function TopWordsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-slate-300">
            <th className="px-3 py-2 text-left font-medium border-b border-slate-800 w-14">
              #
            </th>
            <th className="px-3 py-2 text-left font-medium border-b border-slate-800">
              Слово
            </th>
            <th className="px-3 py-2 text-right font-medium border-b border-slate-800 w-24">
              Частота
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rank} className="hover:bg-white/5">
              <td className="px-3 py-2 align-top border-b border-slate-800">
                {r.rank}
              </td>
              <td className="px-3 py-2 align-top border-b border-slate-800 break-words">
                {r.word}
              </td>
              <td className="px-3 py-2 align-top border-b border-slate-800 text-right">
                {r.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
